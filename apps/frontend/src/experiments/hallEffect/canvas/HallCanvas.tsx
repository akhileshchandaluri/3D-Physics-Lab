import { useEffect, useRef } from 'react';
import {
  calculateMagneticField,
  hallCoefficient,
  hallVoltage,
  SAMPLES,
} from '../physics/hall';
import styles from './HallCanvas.module.css';

interface HallCanvasProps {
  sampleKey: string;
  currentA: number;
  magnetCurrentA: number;
  fieldDirection: '+B' | '-B';
  probePolarity: 'normal' | 'reversed';
  thicknessM?: number;
}

interface CarrierParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

export function HallCanvas({
  sampleKey,
  currentA,
  magnetCurrentA,
  fieldDirection,
  probePolarity,
  thicknessM = 0.0005,
}: HallCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sample = SAMPLES[sampleKey] || SAMPLES['n-germanium'];
  const isNType = sample.type === 'n-type';

  const bMag = calculateMagneticField(magnetCurrentA);
  const signedB = fieldDirection === '+B' ? bMag : -bMag;
  const rh = hallCoefficient(sample.carrierDensityM3, sample.type);
  const vHRaw = hallVoltage(rh, currentA, signedB, thicknessM);
  // Total Hall reading with offset
  const v0 = sample.offsetVoltageV;
  const totalV = vHRaw + (fieldDirection === '+B' ? v0 : v0);
  const displayedV = probePolarity === 'normal' ? totalV : -totalV;
  const displayedMv = (displayedV * 1e3).toFixed(2);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Slab dimensions in canvas coordinates
    const slabW = width * 0.65;
    const slabH = height * 0.42;
    const slabX = (width - slabW) / 2;
    const slabY = (height - slabH) / 2;

    // Carrier particles initialization
    const carrierCount = 65;
    const particles: CarrierParticle[] = Array.from({ length: carrierCount }, () => ({
      x: slabX + Math.random() * slabW,
      y: slabY + 10 + Math.random() * (slabH - 20),
      vx: isNType ? -1.8 : 1.8, // electrons drift left (-x), holes drift right (+x)
      vy: 0,
      color: isNType ? '#38bdf8' : '#f59e0b',
    }));

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw Background grid / bench
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // Subtle bench grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Draw Magnetic Field symbols (dots for out-of-page, crosses for into-page)
      const isOutOfPage = fieldDirection === '+B';
      const bColor =
        bMag > 0.01
          ? isOutOfPage
            ? 'rgba(239, 68, 68, 0.45)'
            : 'rgba(59, 130, 246, 0.45)'
          : 'rgba(148, 163, 184, 0.15)';

      const fieldCols = 8;
      const fieldRows = 5;
      for (let r = 0; r < fieldRows; r++) {
        for (let c = 0; c < fieldCols; c++) {
          const fx = slabX + 30 + c * ((slabW - 60) / (fieldCols - 1));
          const fy = slabY + 20 + r * ((slabH - 40) / (fieldRows - 1));

          ctx.strokeStyle = bColor;
          ctx.fillStyle = bColor;
          ctx.lineWidth = 1.5;

          ctx.beginPath();
          ctx.arc(fx, fy, 8, 0, Math.PI * 2);
          ctx.stroke();

          if (isOutOfPage) {
            // Dot in center
            ctx.beginPath();
            ctx.arc(fx, fy, 2.5, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Cross in center
            ctx.beginPath();
            ctx.moveTo(fx - 4, fy - 4);
            ctx.lineTo(fx + 4, fy + 4);
            ctx.moveTo(fx + 4, fy - 4);
            ctx.lineTo(fx - 4, fy + 4);
            ctx.stroke();
          }
        }
      }

      // 3. Draw Semiconductor Slab
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.fillRect(slabX, slabY, slabW, slabH);
      ctx.strokeRect(slabX, slabY, slabW, slabH);
      ctx.restore();

      // Specimen material label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${sample.name.toUpperCase()} (t = ${thicknessM * 1000} mm)`,
        slabX + slabW / 2,
        slabY + slabH / 2 + 5
      );

      // 4. Draw Current Leads (Left Anode (+) and Right Cathode (-))
      ctx.fillStyle = '#ef4444'; // Red lead (Current In +)
      ctx.fillRect(slabX - 16, slabY + slabH * 0.25, 16, slabH * 0.5);
      ctx.fillStyle = '#3b82f6'; // Blue lead (Current Out -)
      ctx.fillRect(slabX + slabW, slabY + slabH * 0.25, 16, slabH * 0.5);

      // Lead wires extending out
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(slabX - 16, slabY + slabH * 0.5);
      ctx.lineTo(slabX - 45, slabY + slabH * 0.5);
      ctx.stroke();

      ctx.strokeStyle = '#3b82f6';
      ctx.beginPath();
      ctx.moveTo(slabX + slabW + 16, slabY + slabH * 0.5);
      ctx.lineTo(slabX + slabW + 45, slabY + slabH * 0.5);
      ctx.stroke();

      // Current arrow indication across slab
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Current I = ${(currentA * 1000).toFixed(1)} mA →`, slabX + 15, slabY - 12);

      // 5. Transverse Hall Probes (Top Face & Bottom Face)
      const topProbeColor = probePolarity === 'normal' ? '#1e293b' : '#dc2626';
      const bottomProbeColor = probePolarity === 'normal' ? '#dc2626' : '#1e293b';

      // Top Probe
      ctx.fillStyle = topProbeColor;
      ctx.fillRect(slabX + slabW * 0.5 - 10, slabY - 10, 20, 10);
      ctx.strokeStyle = topProbeColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(slabX + slabW * 0.5, slabY - 10);
      ctx.lineTo(slabX + slabW * 0.5, slabY - 32);
      ctx.stroke();

      // Bottom Probe
      ctx.fillStyle = bottomProbeColor;
      ctx.fillRect(slabX + slabW * 0.5 - 10, slabY + slabH, 20, 10);
      ctx.strokeStyle = bottomProbeColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(slabX + slabW * 0.5, slabY + slabH + 10);
      ctx.lineTo(slabX + slabW * 0.5, slabY + slabH + 32);
      ctx.stroke();

      // Probe labels
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.fillText(
        probePolarity === 'normal' ? 'Probe A (Black -)' : 'Probe A (Red +)',
        slabX + slabW * 0.5,
        slabY - 38
      );
      ctx.fillText(
        probePolarity === 'normal' ? 'Probe B (Red +)' : 'Probe B (Black -)',
        slabX + slabW * 0.5,
        slabY + slabH + 46
      );

      // 6. Qualitative Carrier Dynamics with Lorentz Deflection
      // Lorentz force direction:
      // When B > 0 (+B out of page):
      // - Electrons: drift vx < 0, F_L = q(vx * B) = (-e)(-vx * +B) => downward (+y)
      // - Holes: drift vx > 0, F_L = q(vx * B) = (+e)(+vx * +B) => downward (+y)
      // When B < 0 (-B into page):
      // - Force flips upward (-y)
      const lorentzFactor = (signedB / 0.5) * (currentA / 0.005) * 45;
      const targetDeflectionY = isOutOfPage ? lorentzFactor : -lorentzFactor;

      ctx.save();
      // Clip to slab interior
      ctx.beginPath();
      ctx.rect(slabX + 2, slabY + 2, slabW - 4, slabH - 4);
      ctx.clip();

      particles.forEach((p) => {
        // Move horizontally
        const speed = (currentA / 0.005) * 40 * dt;
        p.x += p.vx * speed;

        // Wrap around horizontally
        if (isNType) {
          // Electrons move to the left (-x)
          if (p.x < slabX + 5) {
            p.x = slabX + slabW - 10;
            p.y = slabY + 15 + Math.random() * (slabH - 30);
          }
        } else {
          // Holes move to the right (+x)
          if (p.x > slabX + slabW - 5) {
            p.x = slabX + 10;
            p.y = slabY + 15 + Math.random() * (slabH - 30);
          }
        }

        // Apply Lorentz drift toward top or bottom
        p.y += targetDeflectionY * dt;
        p.y = Math.max(slabY + 8, Math.min(slabY + slabH - 8, p.y));

        // Draw particle
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw +/- sign on particle
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(isNType ? '-' : '+', p.x, p.y);
      });

      ctx.restore();

      // 7. Surface Charge Signs Accumulated on Faces
      const deflectingDown = isOutOfPage;
      const bottomFaceCharge = isNType
        ? deflectingDown
          ? '−'
          : '+'
        : deflectingDown
        ? '+'
        : '−';
      const topFaceCharge = bottomFaceCharge === '−' ? '+' : '−';

      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Top face charges
      ctx.fillStyle = topFaceCharge === '+' ? '#ef4444' : '#38bdf8';
      for (let i = 0; i < 6; i++) {
        const cx = slabX + slabW * 0.2 + i * (slabW * 0.12);
        ctx.fillText(topFaceCharge, cx, slabY + 10);
      }

      // Bottom face charges
      ctx.fillStyle = bottomFaceCharge === '+' ? '#ef4444' : '#38bdf8';
      for (let i = 0; i < 6; i++) {
        const cx = slabX + slabW * 0.2 + i * (slabW * 0.12);
        ctx.fillText(bottomFaceCharge, cx, slabY + slabH - 10);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [
    sample,
    isNType,
    currentA,
    signedB,
    bMag,
    thicknessM,
    fieldDirection,
    probePolarity,
  ]);

  return (
    <div className={styles.canvasWrapper}>
      <div className={styles.canvasHeader}>
        <span>Slab Top-Down View & Lorentz Carrier Deflection</span>
        <span className={styles.qualitativeBadge}>Qualitative Animation</span>
      </div>

      <div className={styles.canvasContainer}>
        <canvas ref={canvasRef} className={styles.canvasElement} />

        <div className={styles.voltmeterOverlay}>
          <div className={styles.voltmeterLabel}>Hall Voltmeter (V_H)</div>
          <div className={styles.voltmeterValue}>
            {displayedMv} <span style={{ fontSize: '13px', color: '#94a3b8' }}>mV</span>
          </div>
          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
            B = {signedB >= 0 ? `+${bMag.toFixed(3)}` : `-${bMag.toFixed(3)}`} T (
            {fieldDirection === '+B' ? 'Out ⊙' : 'In ⊗'})
          </div>
        </div>
      </div>

      <div className={styles.legendBar}>
        <div className={styles.legendItem}>
          <span
            className={styles.legendDot}
            style={{ background: isNType ? '#38bdf8' : '#f59e0b' }}
          />
          <span>
            {isNType ? 'Electrons (n-type, drift ←)' : 'Holes (p-type, drift →)'}
          </span>
        </div>
        <div className={styles.legendItem}>
          <span
            className={styles.legendDot}
            style={{
              background: fieldDirection === '+B' ? '#ef4444' : '#3b82f6',
            }}
          />
          <span>
            Magnetic Field B: {fieldDirection === '+B' ? 'Out of Page ⊙' : 'Into Page ⊗'}
          </span>
        </div>
        <div className={styles.legendItem}>
          <span>Transverse Probes: Red (+) vs Black (-)</span>
        </div>
      </div>
    </div>
  );
};
