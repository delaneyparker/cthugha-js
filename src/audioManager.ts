import { dj2LowOrbit } from "./playlists";

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private currentSource: MediaStreamAudioSourceNode | null = null;
  public leftAnalyser: AnalyserNode;
  public rightAnalyser: AnalyserNode;

  private isLoading: boolean;
  private audioPlaying: boolean;
  private playbackGainNode: GainNode;

  public usingMicrophone: boolean;
  private microphoneGainNode: GainNode;
  private microphoneMuted: boolean;
  private microphoneGain: number;

  private playlist: string[] = dj2LowOrbit;
  private currentTrackIndex: number = 0;

  constructor() {
    this.microphoneGain = 4;
    this.usingMicrophone = false;
    this.microphoneMuted = false;
    this.isLoading = false;
    this.audioPlaying = false;
  }

  public setVolume(volume: number) {
    if (!this.playbackGainNode) return;
    this.playbackGainNode.gain.value = Math.max(0, Math.min(1, volume));
  }

  public getVolume(): number {
    if (!this.playbackGainNode) return 0;
    return this.playbackGainNode.gain.value;
  }

  public setGain(gain: number) {
    if (!this.microphoneGainNode) return;
    this.microphoneGain = Math.max(0, Math.min(8, gain));
    this.microphoneGainNode.gain.value = this.microphoneGain;
    this.microphoneMuted = this.microphoneGain === 0;
  }

  public getGain(): number {
    if (!this.microphoneGainNode) return 0;
    return this.microphoneGainNode.gain.value;
  }

  public togglePlayback() {
    if (this.audioElement) {
      if (this.audioPlaying) {
        this.audioElement.pause();
      } else {
        this.audioElement.play();
      }
      this.audioPlaying = !this.audioPlaying;
    }
  }

  public getCurrentTrackInfo(): string {
    const url = this.playlist[this.currentTrackIndex];
    if (url.startsWith("blob:")) {
      return `[track ${this.currentTrackIndex + 1} / ${this.playlist.length}]`;
    }
    const filename = url.substring(url.lastIndexOf("/") + 1);
    // Remove the suffix (e.g. ".mp3")
    return filename.substring(0, filename.lastIndexOf("."));
  }

  public async setPlaylist(playlist: string[]): Promise<void> {
    this.playlist = playlist;
    this.currentTrackIndex = 0;
    await this.playFromPlaylist();
  }

  public async playFromPlaylist(): Promise<void> {
    if (
      this.playlist.length > 0 &&
      this.currentTrackIndex < this.playlist.length
    ) {
      const url = this.playlist[this.currentTrackIndex];
      console.log("Playing", url);
      await this.loadAndPlayAudio(url);
    }
  }

  public async nextTrack(): Promise<void> {
    this.currentTrackIndex =
      (this.currentTrackIndex + 1) % this.playlist.length;
    await this.playFromPlaylist();
  }

  public async prevTrack(): Promise<void> {
    this.currentTrackIndex =
      (this.currentTrackIndex - 1 + this.playlist.length) %
      this.playlist.length;
    await this.playFromPlaylist();
  }

  public isMusicPlaying(): boolean {
    return this.audioPlaying;
  }

  public isUsingMicrophone(): boolean {
    return this.usingMicrophone;
  }

  private async startAudioContext() {
    if (this.audioContext == null) {
      // @ts-ignore - webkitAudioContext is not in the TypeScript definitions
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
    }
    this.playbackGainNode = this.audioContext.createGain();
    this.playbackGainNode.gain.value = 0.8;
    this.microphoneGainNode = this.audioContext.createGain();
    this.microphoneGainNode.gain.value = 4;
  }

  public async startMicrophoneInput() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("getUserMedia is not supported in this browser");
      alert("Sorry, your browser doesn't seem to support microphone input :(");
      return false;
    }

    try {
      await this.startAudioContext();
      this.stopAudio();

      if (this.currentSource) {
        this.currentSource.disconnect();
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = this.audioContext.createMediaStreamSource(stream);

      // If AnalyserNodes are already created, reuse them, otherwise create new
      this.leftAnalyser = this.audioContext.createAnalyser();
      this.rightAnalyser = this.audioContext.createAnalyser();

      // Since microphone input is mono, we'll just connect it to both analysers for simplicity
      source.connect(this.microphoneGainNode);
      this.microphoneGainNode.connect(this.leftAnalyser);
      this.microphoneGainNode.connect(this.rightAnalyser);

      // No need to connect to destination if you don't want to hear the mic input
      // source.connect(this.audioContext.destination);

      this.currentSource = source;
      this.usingMicrophone = true;
      return true;
    } catch (error) {
      if (error.name === "NotAllowedError") {
        console.error("The user has denied access to the microphone: ", error);
        alert(
          "It looks like you've denied access to the microphone. Please grant permission and try again."
        );
      } else if (error.name === "NotFoundError") {
        console.error("No microphone was found: ", error);
        alert(
          "No microphone was found. Please ensure you have a microphone connected and try again."
        );
      } else {
        console.error("An error occurred: ", error);
        alert(
          "An error occurred while accessing the microphone. Please try again."
        );
      }
    }
    return false;
  }

  public stopMicrophoneInput() {
    if (this.currentSource && this.usingMicrophone) {
      this.currentSource.mediaStream
        .getTracks()
        .forEach((track) => track.stop());
      this.usingMicrophone = false;
      this.currentSource = null;
    }
  }

  public toggleMicrophoneMute() {
    this.microphoneMuted = !this.microphoneMuted;

    if (this.microphoneMuted) {
      this.microphoneGainNode.gain.value = 0;
    } else {
      this.microphoneGainNode.gain.value = this.microphoneGain;
    }
  }

  public isMicrophoneMuted(): boolean {
    return this.microphoneMuted || this.microphoneGain === 0;
  }

  public async loadAndPlayAudio(url: string): Promise<void> {
    await this.startAudioContext();
    if (this.isLoading) return;
    this.isLoading = true;

    this.stopAudio();
    this.stopMicrophoneInput();

    try {
      // Fetch the audio asynchronously; play as soon as possible.
      this.audioElement = new Audio(url);
      this.audioElement.crossOrigin = "anonymous";

      this.audioElement.addEventListener(
        "canplaythrough",
        () => {
          this.audioElement.play();
          this.audioPlaying = true;
        },
        { once: true }
      );

      // When the music ends, move to the next track
      this.audioElement.addEventListener(
        "ended",
        () => {
          this.audioPlaying = false;
          this.nextTrack();
        },
        { once: true }
      );

      const source = this.audioContext.createMediaElementSource(
        this.audioElement
      );

      // Split the audio into left and right channels
      const splitter = this.audioContext.createChannelSplitter(2);

      // Create analysers for each channel
      this.leftAnalyser = this.audioContext.createAnalyser();
      this.rightAnalyser = this.audioContext.createAnalyser();

      // TODO: This might need some tuning...
      this.leftAnalyser.fftSize = 512;
      this.rightAnalyser.fftSize = 512;

      const merger = this.audioContext.createChannelMerger(2);

      source.connect(splitter);

      // Connect each splitter output to an analyser
      splitter.connect(this.leftAnalyser, 0); // Left channel
      splitter.connect(this.rightAnalyser, 1); // Right channel

      // Connect analysers to the destination to hear the sound
      this.leftAnalyser.connect(merger, 0, 0);
      this.rightAnalyser.connect(merger, 0, 1);

      // Connect the merged audio to the gain node, then to the destination
      merger.connect(this.playbackGainNode);
      this.playbackGainNode.connect(this.audioContext.destination);

      this.audioPlaying = true;
      this.audioElement.load();
    } catch (error) {
      console.error("Error playing audio:", error);
    } finally {
      this.isLoading = false;
    }
  }

  public stopAudio() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.removeEventListener("ended", this.nextTrack);
      this.audioElement = null;
    }
    this.audioPlaying = false;
  }

  public getChannelLoudness(analyser: AnalyserNode): number {
    if (!analyser) return 0;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    const sum = dataArray.reduce((a, b) => a + b, 0);
    const average = sum / dataArray.length;
    return average;
  }
}
