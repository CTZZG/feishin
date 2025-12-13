export interface AudioPlayer {
    decreaseVolume(by: number): void;
    increaseVolume(by: number): void;
    pause(): void;
    play(): void;
    seekTo(seekTo: number): void;
    setVolume(volume: number): void;
}

export interface PlayerOnProgressProps {
    played: number;
    playedSeconds: number;
}
