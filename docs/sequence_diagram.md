# Sequence Diagram — Song Generation Use Case

This diagram covers the full lifecycle of song generation, from form submission through async polling to playback.

```mermaid
sequenceDiagram
    actor User
    participant Browser as Browser (Next.js)
    participant Middleware as RequireAuthMiddleware
    participant Controller as GenerationView (Controller)
    participant Service as SongService (Service)
    participant Factory as get_generator()
    participant Strategy as SongGeneratorStrategy
    participant SunoAPI as Suno API
    participant DB as PostgreSQL

    User->>Browser: Fill form & click Generate
    Browser->>Middleware: POST /api/songs/generate/
    Middleware->>Middleware: Check session cookie (creator_id)

    alt No valid session
        Middleware-->>Browser: 401 Unauthorized
    else Session valid
        Middleware->>Controller: Forward request
        Controller->>Service: initiate_generation(creator, title, prompt, ...)

        Service->>DB: Song.objects.create(title)
        DB-->>Service: song instance

        Service->>Factory: get_generator()
        Factory-->>Service: strategy instance

        Service->>Strategy: generate(title, prompt, ...)

        alt Mock strategy
            Strategy-->>Service: GenerationResult(status="complete", audio_url="...", provider_job_id="uuid")
        else Suno strategy
            Strategy->>SunoAPI: POST /api/v1/generate
            SunoAPI-->>Strategy: {data: {taskId: "suno-abc123"}}
            Strategy-->>Service: GenerationResult(status="pending", provider_job_id="suno-abc123")
        end

        alt Generation failed
            Service->>DB: song.delete()
            Service-->>Controller: error
            Controller-->>Browser: 502 {error: "..."}
        else Generation succeeded
            Service->>DB: GenerationJob.objects.create(song, prompt, status, ...)
            DB-->>Service: job instance
            
            alt Immediate complete (Mock)
                Service->>DB: song.audio_url = result.audio_url
                Service->>DB: song.duration = result.duration
            end

            Service-->>Controller: (song, job)
            Controller-->>Browser: 201 {song: {..., generation_job: {status: "pending" or "complete"}}}
        end
    end

    Browser->>User: Show spinner (if pending) or "Song ready!" (if complete)

    loop Poll every 3 seconds (Suno only, while status = pending/processing)
        Browser->>Middleware: GET /api/songs/{id}/generation-status/
        Middleware->>Controller: Forward request
        Controller->>Service: sync_status(job)

        alt Job is pending or processing
            Service->>Strategy: poll(provider_job_id)
            Strategy->>SunoAPI: GET /api/v1/generate/record-info?taskId=suno-abc123
            SunoAPI-->>Strategy: {data: {status: "SUCCESS", response: {sunoData: [{audioUrl: "..."}]}}}
            Strategy-->>Service: GenerationResult(status="complete", audio_url="https://cdn...")
            
            Service->>DB: job.status = "complete"
            Service->>DB: song.audio_url = result.audio_url
            Service->>DB: song.duration = result.duration
        end

        Service-->>Controller: job instance
        Controller-->>Browser: {job: {status: "complete", ...}}
        Browser->>Browser: Stop polling
        Browser->>User: Show "Song ready!" with Play button
    end

    User->>Browser: Click Play
    Browser->>Browser: AudioPlayerContext.play({song_id, title, audio_url})
    Browser->>User: Stream audio from CDN
```

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **Service Layer Indirection** | The `SongService` orchestrates the domain story, decoupling the `GenerationView` from models and strategies (GRASP Indirection). |
| **Strategy Pattern** | `SongService` depends only on the `SongGeneratorStrategy` interface (Protected Variations). |
| **Permanent Asset Ownership** | `Song` owns `audio_url` and `duration` for persistence, while `GenerationJob` owns the "recipe" (prompt, style) and the "process" status. |
| **Information Expert** | The `Song` model manages its own interaction states (favourite/share). |
