// Menü ve gardıroptaki 3D karakterin hareketi: yüzü oyuncuya dönükken bekler ve animasyonunu bir kez
// oynatır, sonra animasyonsuz bir tam tur atar; öne geri gelince aynısı tekrarlanır. Sürüklenince
// oyuncu çevirir; bırakınca bir süre sonra en yakın "önden bakış" açısına döner.
// Saf durum makinesi: çizim ve animasyon CharacterModelView'da, burada yalnızca açı ve komutlar var.

const TAU = Math.PI * 2;

// Öne gelince ve animasyondan sonra bekleme (sn)
export const HOLD_SECONDS = 1;
// Animasyonu olmayan (sabit pozlu) modelde önde bekleme (sn)
export const STATIC_HOLD_SECONDS = 2.5;
// Bir tam tur süresi (sn)
export const TURN_SECONDS = 10;
// Bırakıldıktan sonra kendi kendine dönmeye başlamadan önce beklenen süre (sn)
export const RESUME_DELAY_SECONDS = 1.8;
// Bırakılan dönüşün saniyedeki sönümü (1'e yakın = uzun süzülme)
const SPIN_DAMPING = 0.04;
// Bu kadar yakın bir önden bakış açısı geride kaldıysa ileri tur yerine ona geri dönülür (radyan)
const SNAP_BACK = (25 * Math.PI) / 180;
// Kısa dönüşlerin en az süresi (sn)
const MIN_RETURN_SECONDS = 0.6;

const smoothstep = (t: number) => t * t * (3 - 2 * t);

export type MotionPhase = 'hold' | 'play' | 'turn' | 'manual';

// Görüntüleyicinin animasyona uygulaması gereken komut
export type MotionCommand = 'play' | 'rest' | null;

export class TurntableMotion {
  phase: MotionPhase = 'hold';
  yaw = 0;
  private elapsed = 0;
  // Bu önde bekleyişte animasyon oynadı mı (oynadıysa sıradaki adım tur)
  private played = false;
  private turnFrom = 0;
  private turnTo = 0;
  private turnDuration = 1;
  private velocity = 0;
  private resumeIn = 0;
  private dragging = false;
  // Son dönüş yönü: +1 kendi kendine dönüş yönü
  private direction = 1;
  private clipSeconds = 0;

  constructor(private readonly reduceMotion = false) {}

  // Modelin animasyonu yüklenince süresi verilir; 0 ise sabit poz kabul edilir
  setClip(seconds: number) {
    this.clipSeconds = seconds;
  }

  private get hasClip() {
    return this.clipSeconds > 0.1;
  }

  update(dt: number): MotionCommand {
    switch (this.phase) {
      case 'hold': {
        if (this.reduceMotion) return null;
        this.elapsed += dt;
        const limit = this.hasClip ? HOLD_SECONDS : STATIC_HOLD_SECONDS;
        if (this.elapsed < limit) return null;
        if (this.hasClip && !this.played) {
          this.enter('play');
          return 'play';
        }
        this.startTurn(this.yaw + this.direction * TAU);
        return null;
      }
      case 'play': {
        // Olay gelmezse (ör. sekme arka plandaydı) klip süresi dolunca da biter
        this.elapsed += dt;
        return this.elapsed > this.clipSeconds + 0.5 ? this.clipFinished() : null;
      }
      case 'turn': {
        this.elapsed += dt;
        const t = Math.min(1, this.elapsed / this.turnDuration);
        this.yaw = this.turnFrom + (this.turnTo - this.turnFrom) * smoothstep(t);
        if (t >= 1) {
          this.yaw = this.turnTo;
          this.played = false;
          this.enter('hold');
        }
        return null;
      }
      case 'manual': {
        if (this.dragging) return null;
        if (Math.abs(this.velocity) > 0.01) {
          this.yaw += this.velocity * dt;
          this.velocity *= Math.pow(SPIN_DAMPING, dt);
          return null;
        }
        if (this.reduceMotion) return null;
        this.resumeIn -= dt;
        if (this.resumeIn <= 0) this.returnToFront();
        return null;
      }
    }
  }

  // Animasyon klibi sona erdi
  clipFinished(): MotionCommand {
    if (this.phase !== 'play') return null;
    this.played = true;
    this.enter('hold');
    return 'rest';
  }

  beginDrag(): MotionCommand {
    const wasPlaying = this.phase === 'play';
    this.enter('manual');
    this.dragging = true;
    this.velocity = 0;
    return wasPlaying ? 'rest' : null;
  }

  // delta: bu hareketteki açı (radyan), velocity: anlık hız (radyan/sn)
  dragBy(delta: number, velocity: number) {
    this.yaw += delta;
    this.velocity = velocity;
    if (delta !== 0) this.direction = delta > 0 ? 1 : -1;
  }

  endDrag(keepVelocity: boolean) {
    if (!keepVelocity) this.velocity = 0;
    this.dragging = false;
    this.resumeIn = RESUME_DELAY_SECONDS;
  }

  private enter(phase: MotionPhase) {
    this.phase = phase;
    this.elapsed = 0;
  }

  private startTurn(to: number) {
    this.turnFrom = this.yaw;
    this.turnTo = to;
    const span = Math.abs(to - this.yaw);
    this.turnDuration = Math.max(MIN_RETURN_SECONDS, (TURN_SECONDS * span) / TAU);
    this.enter('turn');
  }

  // Bırakılan karakter dönüş yönündeki ilk önden bakış açısına gider; az önce geçtiyse geri döner
  private returnToFront() {
    const turns = this.yaw / TAU;
    const ahead = (this.direction > 0 ? Math.ceil(turns) : Math.floor(turns)) * TAU;
    const behind = (this.direction > 0 ? Math.floor(turns) : Math.ceil(turns)) * TAU;
    const target = Math.abs(this.yaw - behind) <= SNAP_BACK ? behind : ahead;
    this.played = false;
    if (Math.abs(target - this.yaw) < 1e-3) {
      this.yaw = target;
      this.enter('hold');
      return;
    }
    this.startTurn(target);
  }
}
