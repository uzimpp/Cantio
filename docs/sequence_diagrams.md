# Sequence Diagrams — Cantio

This document illustrates the dynamic behavior of Cantio through **Mermaid sequence diagrams**.

---

## 1. Authentication Flow (Google OAuth)

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant LoginPage
    participant AuthContext
    participant AuthView
    participant AuthService
    participant Google
    participant MusicCreator

    User->>Browser: Navigate to /login
    Browser->>LoginPage: Render
    LoginPage->>AuthContext: creator exists?
    AuthContext->>AuthView: GET /api/auth/me/

    alt User not authenticated
        User->>LoginPage: Click "Continue with Google"
        LoginPage->>AuthContext: signInWithGoogle()
        AuthContext->>AuthView: Redirect to /api/auth/google/
        AuthView->>Google: OAuth authorize request
        Google-->>User: Login prompt
        User->>Google: Enter credentials
        Google-->>AuthView: Redirect to /api/auth/callback/?code=xxx
        AuthView->>AuthService: process_google_callback(code)
        AuthService->>Google: Exchange code for tokens
        Google-->>AuthService: id_token
        AuthService->>AuthService: verify_oauth2_token()
        AuthService->>MusicCreator: get_or_create(email=xxx)
        MusicCreator-->>AuthService: MusicCreator instance
        AuthService-->>AuthView: (creator, None)
        AuthView->>AuthView: Set session creator_id
        AuthView-->>Browser: Redirect to /
        Browser->>AuthContext: GET /api/auth/me/
        AuthContext-->>Browser: creator data
    end
```

---

## 2. Song Generation Flow

```mermaid
sequenceDiagram
    actor User
    participant GeneratePage
    participant GenerationView
    participant GenerationService
    participant Library
    participant Song
    participant GenerationJob
    participant StrategyFactory
    participant SongGeneratorStrategy
    participant SunoSongGeneratorStrategy

    User->>GeneratePage: Fill form & Submit
    GeneratePage->>GenerationView: POST /api/songs/generate/

    GenerationView->>GenerationService: initiate_generation(creator, title, prompt, ...)

    GenerationService->>Library: Library.objects.get(creator=creator)
    Library-->>GenerationService: Library instance

    GenerationService->>GenerationJob: Check idempotency (10s window)
    GenerationJob-->>GenerationService: None (new request)

    GenerationService->>Song: Song.objects.create()
    Song-->>GenerationService: Song instance (pending)

    GenerationService->>GenerationJob: GenerationJob.objects.create()
    GenerationJob-->>GenerationService: GenerationJob instance (PENDING)

    GenerationService->>StrategyFactory: get_generator()
    StrategyFactory-->>GenerationService: SongGeneratorStrategy

    alt Mock Strategy (dev mode)
        GenerationService->>SongGeneratorStrategy: generate()
        SongGeneratorStrategy-->>GenerationService: {status: "complete", audio_url, duration}
    else Live Strategy (Suno)
        GenerationService->>SongGeneratorStrategy: generate()
        SongGeneratorStrategy->>SunoSongGeneratorStrategy: POST /api/v1/generate
        SunoSongGeneratorStrategy-->>SongGeneratorStrategy: {provider_job_id, status: "pending"}
        SongGeneratorStrategy-->>GenerationService: GenerationResult
    end

    alt Immediate completion (Mock)
        GenerationService->>Song: audio_url, duration = result
        GenerationService->>GenerationJob: status = "complete"
    else Pending (Suno)
        GenerationService->>GenerationJob: provider_job_id, status = result
    end

    GenerationService-->>GenerationView: (song, job, error)
    GenerationView-->>GeneratePage: {song, generation_job}

    alt Poll for completion (Suno)
        GeneratePage->>GenerationView: GET /api/songs/{id}/generation-status/
        GenerationView->>GenerationService: sync_status(job)
        GenerationService->>SongGeneratorStrategy: poll(provider_job_id)
        SongGeneratorStrategy-->>GenerationService: {status, audio_url, duration}
        GenerationService->>GenerationJob: status = result
        GenerationService->>Song: audio_url, duration = result
        GenerationService-->>GenerationView: updated job
        GenerationView-->>GeneratePage: {job}
    end
```

---

## 3. Favourite/Unfavourite Flow

```mermaid
sequenceDiagram
    actor User
    participant SongCard
    participant SongView
    participant Song

    User->>SongCard: Click Heart icon
    SongCard->>SongView: POST /api/songs/{id}/favourite/
    SongView->>Song: Song.objects.get(pk=id)
    Song->>Song: toggle_favourite()
    Note over Song: is_favourited = !is_favourited
    Song->>Song: save()
    Song-->>SongView: Song instance
    SongView-->>SongCard: {song}
    SongCard->>SongCard: onFavouriteToggle(id, newValue)
    SongCard-->>User: Update UI (filled/empty heart)
```

---

## 4. Share/Unshare Flow

```mermaid
sequenceDiagram
    actor User
    participant SongCard
    participant SongView
    participant Song

    alt Make Public
        User->>SongCard: Click Globe icon (private)
        SongCard->>SongView: POST /api/songs/{id}/share/
        SongView->>Song: Song.objects.get(pk=id)
        Song->>Song: share()
        Note over Song: is_private = False<br/>shareable_url = uuid
        Song-->>SongView: Song instance
        SongView-->>SongCard: {song}
        SongCard-->>User: Show "Public" badge & copy link button
    else Make Private
        User->>SongCard: Click Lock icon (public)
        SongCard->>SongView: DELETE /api/songs/{id}/share/
        SongView->>Song: Song.objects.get(pk=id)
        Song->>Song: revoke_share()
        Note over Song: is_private = True<br/>shareable_url = None
        Song-->>SongView: Song instance
        SongView-->>SongCard: {song}
        SongCard-->>User: Show "Private" badge
    end

    User->>SongCard: Click Copy Link
    SongCard->>SongCard: navigator.clipboard.writeText(url)
    SongCard-->>User: Show "Copied!" toast
```

---

## 5. Delete Song Flow

```mermaid
sequenceDiagram
    actor User
    participant SongCard
    participant SongView
    participant Song

    User->>SongCard: Click Delete icon
    SongCard->>SongCard: Confirm dialog
    User->>SongCard: Confirm
    SongCard->>SongView: DELETE /api/songs/{id}/
    SongView->>Song: Song.objects.get(pk=id)
    Song->>Song: delete()
    Song-->>SongView: Deleted
    SongView-->>SongCard: {message: "song deleted"}
    SongCard->>SongCard: onDelete(id)
    SongCard-->>User: Remove card from list (animation)
```

---

## 6. Fetch Library Flow

```mermaid
sequenceDiagram
    actor User
    participant DashboardPage
    participant LibraryView
    participant MusicCreator
    participant Song
    participant MusicSerializer

    User->>DashboardPage: Navigate to /dashboard
    DashboardPage->>LibraryView: GET /api/creators/{id}/songs/
    LibraryView->>MusicCreator: MusicCreator.objects.get(pk=id)
    MusicCreator-->>LibraryView: MusicCreator instance
    LibraryView->>Song: Song.objects.filter(library__creator=creator)
    Song-->>LibraryView: [Song, Song, ...]
    LibraryView->>MusicSerializer: song_to_json(song) for each
    MusicSerializer-->>LibraryView: [{...}, {...}, ...]
    LibraryView-->>DashboardPage: {songs: [...]}
    DashboardPage-->>User: Render song grid
```

---

## 7. Audio Playback Flow

```mermaid
sequenceDiagram
    actor User
    participant SongCard
    participant AudioPlayerContext
    participant AudioPlayer
    participant AudioPlayerBar

    User->>SongCard: Click Play button
    SongCard->>AudioPlayerContext: play(track)
    AudioPlayerContext->>AudioPlayer: new Audio()
    AudioPlayerContext->>AudioPlayer: audio.src = audio_url
    AudioPlayerContext->>AudioPlayer: audio.play()
    AudioPlayer-->>AudioPlayerContext: Promise resolves
    AudioPlayerContext-->>SongCard: isPlaying = true
    AudioPlayerContext->>AudioPlayerBar: current, isPlaying, duration
    AudioPlayerBar-->>User: Show player bar with song info

    loop timeupdate
        AudioPlayer->>AudioPlayerContext: currentTime
        AudioPlayerContext->>AudioPlayerBar: currentTime
        AudioPlayerBar-->>User: Update progress bar
    end

    User->>AudioPlayerBar: Click pause
    AudioPlayerBar->>AudioPlayerContext: pause()
    AudioPlayerContext->>AudioPlayer: audio.pause()
    AudioPlayerContext-->>AudioPlayerBar: isPlaying = false
    AudioPlayerBar-->>User: Show pause state

    User->>AudioPlayerBar: Click play
    AudioPlayerBar->>AudioPlayerContext: resume()
    AudioPlayerContext->>AudioPlayer: audio.play()
    AudioPlayerContext-->>AudioPlayerBar: isPlaying = true
    AudioPlayerBar-->>User: Show play state

    User->>AudioPlayerBar: Click seek
    AudioPlayerBar->>AudioPlayerContext: seek(time)
    AudioPlayerContext->>AudioPlayer: audio.currentTime = time
```

---

## 8. Shared Song Access Flow

```mermaid
sequenceDiagram
    actor User
    participant SharePage
    participant SongView
    participant Song

    User->>SharePage: Navigate to /share/{song_id}
    SharePage->>SongView: GET /api/songs/{id}/
    SongView->>Song: Song.objects.get(pk=id)
    Song-->>SongView: Song instance

    alt Song is public
        SongView-->>SharePage: {song}
        SharePage-->>User: Render public song page with play button
    else Song is private
        SongView-->>SharePage: 404 error
        SharePage-->>User: "Song not found" message
    end

    User->>SharePage: Click play
    SharePage->>SharePage: play() or pause()
    SharePage-->>User: Toggle playback
```