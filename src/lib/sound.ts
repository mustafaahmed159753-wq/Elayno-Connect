// Web Audio API Sound Synthesizer with Selectable Ringtones and Notification Sounds for Elyano Connect

export type RingtoneOption =
  | "classic"
  | "digital"
  | "marimba"
  | "emergency"
  | "symphonic"
  | "cyber"
  | "celestial"
  | "gentle"
  | "aurora"
  | "echo"
  | "zenith"
  | "vital"
  | "solaris"
  | "nova"
  | "oasis"
  | "paramedic"
  | "velvet"
  | "cascade"
  | "starlight"
  | "hospital_code";

export type NotificationOption =
  | "chime"
  | "pop"
  | "radar"
  | "hospital"
  | "crystal"
  | "harp"
  | "bloop"
  | "breeze"
  | "zen"
  | "waterdrop"
  | "cosmic"
  | "pulse"
  | "ting"
  | "bubble"
  | "affirm"
  | "sonar"
  | "bell"
  | "whisper"
  | "sparkle"
  | "cardiac";

export const RINGTONE_OPTIONS: { id: RingtoneOption; name: string; desc: string }[] = [
  { id: "classic", name: "Classic Hospital Phone", desc: "Standard dual-frequency telephone chime" },
  { id: "digital", name: "Digital Soft Pulse", desc: "Modern electronic pulse sequence" },
  { id: "marimba", name: "Marimba Harmony", desc: "Soft melodic four-note wave" },
  { id: "emergency", name: "Urgent Care Call", desc: "High-priority hospital alert tone" },
  { id: "symphonic", name: "Symphonic Bells", desc: "Orchestral resonant bell chime" },
  { id: "cyber", name: "Cyber Resonance", desc: "Futuristic dual-tone sweep" },
  { id: "celestial", name: "Celestial Chime Wave", desc: "Serene glass harp harmony" },
  { id: "gentle", name: "Gentle Soft Tone", desc: "Relaxing ambient call tone" },
  { id: "aurora", name: "Aurora Ambient Wave", desc: "Lush multi-harmonic luminous tone" },
  { id: "echo", name: "Crystal Echo Cascade", desc: "Ethereal cascading chimes with reverberation" },
  { id: "zenith", name: "Zenith Executive Strum", desc: "Crisp melodic harp-like arpeggio" },
  { id: "vital", name: "Vital Monitor Pulse", desc: "Calm diagnostic bio-rhythm melody" },
  { id: "solaris", name: "Solaris Dawn Pulse", desc: "Warm golden arpeggio rising across radiant frequencies" },
  { id: "nova", name: "Nova Starlight Sequence", desc: "Vibrant celestial multi-stage shimmering sequence" },
  { id: "oasis", name: "Oasis Meditative Flow", desc: "Gentle melodic chime notes with calming sustain" },
  { id: "paramedic", name: "Paramedic Dispatch Sync", desc: "Distinctive rhythmic dual medical dispatch pulse" },
  { id: "velvet", name: "Velvet Nocturne", desc: "Deep warm harmonic velvet bell tones" },
  { id: "cascade", name: "Cascade Waterfall Chimes", desc: "Rapid cascading liquid bells with soft decay" },
  { id: "starlight", name: "Starlight Celestial", desc: "Crystalline pentatonic celestial tones" },
  { id: "hospital_code", name: "Code Blue Clinical Alert", desc: "High-clarity medical chime interval" },
];

export const NOTIFICATION_OPTIONS: { id: NotificationOption; name: string; desc: string }[] = [
  { id: "chime", name: "Gentle Ascending Chime", desc: "Smooth two-note ascending chime" },
  { id: "pop", name: "Soft Pop Bell", desc: "Crisp and subtle message bubble pop" },
  { id: "radar", name: "Radar Echo Pulse", desc: "Double-tap sonar audio pulse" },
  { id: "hospital", name: "Hospital Paging Ping", desc: "Clear medical intercom ping" },
  { id: "crystal", name: "Crystal Droplet Ping", desc: "Bright pure crystal drop tone" },
  { id: "harp", name: "Soft Harp Strum", desc: "Soothing acoustic harp chord" },
  { id: "bloop", name: "Tech Bloop Accent", desc: "Clean modern app interface bloop" },
  { id: "breeze", name: "Wind Breeze Swoosh", desc: "Subtle soft ambient chime sweep" },
  { id: "zen", name: "Zen Tibetan Singing Bowl", desc: "Warm resonant singing bowl harmonic" },
  { id: "waterdrop", name: "Water Droplet Ripple", desc: "Delicate organic water drop ping" },
  { id: "cosmic", name: "Cosmic Sparkle Ping", desc: "High-frequency shimmering chime" },
  { id: "pulse", name: "Warm Sub-Pulse", desc: "Deep soothing low-frequency pulse" },
  { id: "ting", name: "Crystal Glass Ping", desc: "Ultra-pure high glass ping with shimmer" },
  { id: "bubble", name: "Liquid Bubble Pop", desc: "Organic fluid water bubble burst" },
  { id: "affirm", name: "Positive Affirmation", desc: "Uplifting three-tone major harmony" },
  { id: "sonar", name: "Sub-Sea Sonar Ping", desc: "Deep reverberant underwater sonar sweep" },
  { id: "bell", name: "Service Counter Bell", desc: "Bright metallic hospitality desk bell" },
  { id: "whisper", name: "Whisper Air Chime", desc: "Gentle airy chime for quiet environments" },
  { id: "sparkle", name: "Magic Sparkle Pulse", desc: "Fast stardust harmonic twinkle" },
  { id: "cardiac", name: "Cardiac Vital Blip", desc: "Crisp bio-monitor electronic pulse" },
];

class SoundManager {
  private ctx: AudioContext | null = null;
  private ringtoneInterval: number | null = null;
  private outgoingInterval: number | null = null;
  private activeOscillators: OscillatorNode[] = [];

  public currentRingtone: RingtoneOption =
    (localStorage.getItem("elyano_ringtone") as RingtoneOption) || "classic";
  public currentNotificationSound: NotificationOption =
    (localStorage.getItem("elyano_notification_sound") as NotificationOption) || "chime";

  public trackOscillator(osc: OscillatorNode) {
    this.activeOscillators.push(osc);
    osc.onended = () => {
      this.activeOscillators = this.activeOscillators.filter((o) => o !== osc);
    };
  }

  public stopAllOscillators() {
    this.activeOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (_) {}
    });
    this.activeOscillators = [];
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setRingtone(type: RingtoneOption) {
    this.currentRingtone = type;
    localStorage.setItem("elyano_ringtone", type);
  }

  public setNotificationSound(type: NotificationOption) {
    this.currentNotificationSound = type;
    localStorage.setItem("elyano_notification_sound", type);
  }

  // Play incoming message notification based on current selection or specified preview sound
  public playMessageSound(soundType?: NotificationOption) {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const sound = soundType || this.currentNotificationSound;
      const now = ctx.currentTime;

      if (sound === "chime") {
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(587.33, now); // D5
        gain1.gain.setValueAtTime(0.15, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.25);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(880, now + 0.08); // A5
        gain2.gain.setValueAtTime(0.2, now + 0.08);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.45);
      } else if (sound === "pop") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(1046.5, now); // C6
        osc.frequency.exponentialRampToValueAtTime(1318.5, now + 0.08); // E6
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (sound === "radar") {
        [0, 0.12].forEach((offset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(880, now + offset);
          gain.gain.setValueAtTime(0.18, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.1);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + offset);
          osc.stop(now + offset + 0.1);
        });
      } else if (sound === "hospital") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(1046.5, now + 0.1); // C6
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (sound === "crystal") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(1760, now); // A6
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (sound === "harp") {
        [440, 554.37, 659.25, 880].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);
          gain.gain.setValueAtTime(0.12, now + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 0.35);
        });
      } else if (sound === "bloop") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (sound === "breeze") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.2);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (sound === "zen") {
        [432, 864, 1296].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.18 / (idx + 1), now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 1.2);
        });
      } else if (sound === "waterdrop") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(2200, now + 0.06);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (sound === "cosmic") {
        [1200, 1600, 2400].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now + idx * 0.04);
          gain.gain.setValueAtTime(0.14, now + idx * 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.04);
          osc.stop(now + idx * 0.04 + 0.3);
        });
      } else if (sound === "pulse") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (sound === "ting") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(2637, now); // E7
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (sound === "bubble") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(1800, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.16);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (sound === "affirm") {
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);
          gain.gain.setValueAtTime(0.18, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.28);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.28);
        });
      } else if (sound === "sonar") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(1350, now);
        osc.frequency.exponentialRampToValueAtTime(950, now + 0.35);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.6);
      } else if (sound === "bell") {
        [1174.66, 1760].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.15 / (idx + 1), now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.4);
        });
      } else if (sound === "whisper") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(659.25, now);
        osc.frequency.linearRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.1, now + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (sound === "sparkle") {
        [1567.98, 1760, 2093, 2637].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.035);
          gain.gain.setValueAtTime(0.12, now + idx * 0.035);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.035 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.035);
          osc.stop(now + idx * 0.035 + 0.25);
        });
      } else if (sound === "cardiac") {
        [0, 0.14].forEach((offset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(780, now + offset);
          gain.gain.setValueAtTime(0.22, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.08);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + offset);
          osc.stop(now + offset + 0.08);
        });
      }
    } catch (e) {
      console.warn("Could not play message sound:", e);
    }
  }

  // Play ringtone single iteration for call or preview
  public playRingtoneOnce(ringtoneType?: RingtoneOption) {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const type = ringtoneType || this.currentRingtone;
      const now = ctx.currentTime;

      if (type === "classic") {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.type = "sine";
        osc2.type = "sine";
        osc1.frequency.setValueAtTime(440, now);
        osc2.frequency.setValueAtTime(480, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.setValueAtTime(0.15, now + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.4);
        osc2.stop(now + 1.4);
      } else if (type === "digital") {
        [0, 0.25, 0.5].forEach((offset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "square";
          osc.frequency.setValueAtTime(880, now + offset);
          gain.gain.setValueAtTime(0.08, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.15);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + offset);
          osc.stop(now + offset + 0.15);
        });
      } else if (type === "marimba") {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.15);
          gain.gain.setValueAtTime(0.15, now + idx * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.15);
          osc.stop(now + idx * 0.15 + 0.3);
        });
      } else if (type === "emergency") {
        [0, 0.3, 0.6].forEach((offset, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(idx % 2 === 0 ? 800 : 1000, now + offset);
          gain.gain.setValueAtTime(0.1, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.22);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + offset);
          osc.stop(now + offset + 0.22);
        });
      } else if (type === "symphonic") {
        [523.25, 659.25, 783.99, 987.77, 1046.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.2);
          gain.gain.setValueAtTime(0.14, now + idx * 0.2);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.2 + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.2);
          osc.stop(now + idx * 0.2 + 0.6);
        });
      } else if (type === "cyber") {
        [0, 0.2, 0.4].forEach((offset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(600, now + offset);
          osc.frequency.exponentialRampToValueAtTime(1400, now + offset + 0.15);
          gain.gain.setValueAtTime(0.12, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.18);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + offset);
          osc.stop(now + offset + 0.18);
        });
      } else if (type === "celestial") {
        [880, 1046.5, 1318.51, 1567.98].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.18);
          gain.gain.setValueAtTime(0.1, now + idx * 0.18);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.18 + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.18);
          osc.stop(now + idx * 0.18 + 0.5);
        });
      } else if (type === "gentle") {
        [440, 523.25, 659.25].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.25);
          gain.gain.setValueAtTime(0.08, now + idx * 0.25);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.25 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.25);
          osc.stop(now + idx * 0.25 + 0.4);
        });
      } else if (type === "aurora") {
        [329.63, 440, 554.37, 659.25, 880].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.16);
          gain.gain.setValueAtTime(0.12, now + idx * 0.16);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.16 + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.16);
          osc.stop(now + idx * 0.16 + 0.6);
        });
      } else if (type === "echo") {
        [1046.5, 1318.51, 1567.98, 2093.0].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.14);
          gain.gain.setValueAtTime(0.09, now + idx * 0.14);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.14 + 0.55);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.14);
          osc.stop(now + idx * 0.14 + 0.55);
        });
      } else if (type === "zenith") {
        [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);
          gain.gain.setValueAtTime(0.11, now + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.1);
          osc.stop(now + idx * 0.1 + 0.5);
        });
      } else if (type === "vital") {
        [600, 900, 600, 1200].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.2);
          gain.gain.setValueAtTime(0.12, now + idx * 0.2);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.2 + 0.15);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.2);
          osc.stop(now + idx * 0.2 + 0.15);
        });
      } else if (type === "solaris") {
        [440, 554.37, 659.25, 830.61, 880].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.14);
          gain.gain.setValueAtTime(0.12, now + idx * 0.14);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.45);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.14);
          osc.stop(now + idx * 0.14 + 0.45);
        });
      } else if (type === "nova") {
        [659.25, 783.99, 987.77, 1174.66, 1318.51].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now + idx * 0.11);
          gain.gain.setValueAtTime(0.1, now + idx * 0.11);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.11 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.11);
          osc.stop(now + idx * 0.11 + 0.4);
        });
      } else if (type === "oasis") {
        [392.0, 523.25, 659.25, 783.99].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.22);
          gain.gain.setValueAtTime(0.13, now + idx * 0.22);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.22 + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.22);
          osc.stop(now + idx * 0.22 + 0.6);
        });
      } else if (type === "paramedic") {
        [600, 750, 600, 750].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "square";
          osc.frequency.setValueAtTime(freq, now + idx * 0.16);
          gain.gain.setValueAtTime(0.06, now + idx * 0.16);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.16 + 0.14);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.16);
          osc.stop(now + idx * 0.16 + 0.14);
        });
      } else if (type === "velvet") {
        [349.23, 440, 523.25, 698.46].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.18);
          gain.gain.setValueAtTime(0.14, now + idx * 0.18);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.18 + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.18);
          osc.stop(now + idx * 0.18 + 0.5);
        });
      } else if (type === "cascade") {
        [1046.5, 987.77, 783.99, 659.25, 523.25].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.11, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.35);
        });
      } else if (type === "starlight") {
        [880, 1174.66, 1318.51, 1760].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.15);
          gain.gain.setValueAtTime(0.1, now + idx * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.15 + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.15);
          osc.stop(now + idx * 0.15 + 0.5);
        });
      } else if (type === "hospital_code") {
        [700, 1050, 700, 1050].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.18);
          gain.gain.setValueAtTime(0.14, now + idx * 0.18);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.18 + 0.15);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.18);
          osc.stop(now + idx * 0.18 + 0.15);
        });
      }
    } catch (e) {}
  }

  // Loop active ringtone during incoming call
  public startRingtone() {
    this.stopRingtone();
    this.playRingtoneOnce();
    this.ringtoneInterval = window.setInterval(() => {
      this.playRingtoneOnce();
    }, 2500);
  }

  public stopRingtone() {
    if (this.ringtoneInterval !== null) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
    this.stopAllOscillators();
  }

  // Outgoing call ringback sound
  public startOutgoingRing() {
    this.stopOutgoingRing();
    const playRingback = () => {
      try {
        const ctx = this.getContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        this.trackOscillator(osc);
        osc.start(now);
        osc.stop(now + 1.2);
      } catch (e) {}
    };

    playRingback();
    this.outgoingInterval = window.setInterval(playRingback, 3000);
  }

  public stopOutgoingRing() {
    if (this.outgoingInterval !== null) {
      clearInterval(this.outgoingInterval);
      this.outgoingInterval = null;
    }
    this.stopAllOscillators();
  }

  public playCallConnected() {
    this.stopRingtone();
    this.stopOutgoingRing();
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.2);
      });
    } catch (e) {}
  }

  public playCallEnded() {
    this.stopRingtone();
    this.stopOutgoingRing();
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [440, 349.23].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.12, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.25);
      });
    } catch (e) {}
  }

  public stopAll() {
    this.stopRingtone();
    this.stopOutgoingRing();
    this.stopAllOscillators();
  }
}

export const soundManager = new SoundManager();
