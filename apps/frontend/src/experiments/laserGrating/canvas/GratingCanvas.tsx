import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  diffractionSinTheta,
  diffractionAngleRad,
  spotPositionM,
  singleSlitIntensity,
} from '../physics/grating';
import styles from './GratingCanvas.module.css';

interface GratingCanvasProps {
  wavelengthM: number;
  linesPerMm: number;
  distanceM: number;
  onRecordOrder?: (orderN: number, xMm: number) => void;
  isReadOnly?: boolean;
}

function getLaserColor(wavelengthM: number): { hex: string; rgb: string } {
  const nm = Math.round(wavelengthM * 1e9);
  if (nm <= 550) {
    return { hex: '#10b981', rgb: '16, 185, 129' }; // Green (532 nm)
  }
  if (nm <= 640) {
    return { hex: '#f97316', rgb: '249, 115, 22' }; // He-Ne Orange-Red (633 nm)
  }
  return { hex: '#ef4444', rgb: '239, 68, 68' }; // Diode Red (650 nm)
}

export function GratingCanvas({
  wavelengthM,
  linesPerMm,
  distanceM,
  onRecordOrder,
  isReadOnly = false,
}: GratingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Ruler cursor position in mm from optical axis (0 mm)
  const [rulerXMm, setRulerXMm] = useState(99.4);
  const [isDragging, setIsDragging] = useState(false);

  const laserColor = useMemo(() => getLaserColor(wavelengthM), [wavelengthM]);

  // Compute status for orders -3..3
  const ordersInfo = useMemo(() => {
    return [-3, -2, -1, 0, 1, 2, 3].map((n) => {
      const sinCheck = diffractionSinTheta(n, wavelengthM, linesPerMm);
      const angle = diffractionAngleRad(n, wavelengthM, linesPerMm);
      const spot = spotPositionM(n, wavelengthM, linesPerMm, distanceM);
      const intensity = angle.exists
        ? singleSlitIntensity(angle.thetaRad, linesPerMm, wavelengthM)
        : 0;

      return {
        n,
        exists: sinCheck.exists,
        sinTheta: sinCheck.sinTheta,
        thetaRad: angle.thetaRad,
        thetaDeg: (angle.thetaRad * 180) / Math.PI,
        xMm: spot.xM * 1000,
        isOnScreen: spot.isOnScreen,
        intensity,
      };
    });
  }, [wavelengthM, linesPerMm, distanceM]);

  // Dynamic scale factor: px per mm to fit visible spots cleanly
  const scalePxPerMm = useMemo(() => {
    const existingOrders = ordersInfo.filter((o) => o.exists && o.isOnScreen && o.n !== 0);
    const maxXMm = existingOrders.length > 0
      ? Math.max(...existingOrders.map((o) => Math.abs(o.xMm)))
      : 120;
    // Fit +/- maxXMm inside half-width (say 270 px)
    return Math.min(2.0, Math.max(0.4, 260 / (maxXMm * 1.15)));
  }, [ordersInfo]);

  // Snap ruler to theoretical order n
  const handleSnapToOrder = useCallback(
    (orderN: number) => {
      const info = ordersInfo.find((o) => o.n === orderN);
      if (info && info.exists) {
        setRulerXMm(Number(info.xMm.toFixed(1)));
      }
    },
    [ordersInfo]
  );

  // Draw 2D Canvas views
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 640;
    const height = 520;
    canvas.width = width;
    canvas.height = height;

    const cx = width / 2;

    // View boundaries
    const schematicTop = 0;
    const schematicHeight = 160;

    const screenViewTop = schematicHeight;
    const screenViewHeight = 220;

    const plotTop = screenViewTop + screenViewHeight;
    const plotHeight = height - plotTop;

    // ─── 1. TOP-VIEW SCHEMATIC (Laser -> Grating -> Screen) ───
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, schematicTop, width, schematicHeight);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Optical Setup: Top-View Schematic', 14, schematicTop + 18);

    const laserX = 40;
    const opticalAxisY = schematicTop + 90;
    const gratingX = 180;
    const screenX = width - 50;

    // Laser box
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.fillRect(laserX, opticalAxisY - 14, 55, 28);
    ctx.strokeRect(laserX, opticalAxisY - 14, 55, 28);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Laser', laserX + 27, opticalAxisY + 4);

    // Laser beam to grating
    ctx.strokeStyle = laserColor.hex;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(laserX + 55, opticalAxisY);
    ctx.lineTo(gratingX, opticalAxisY);
    ctx.stroke();

    // Grating slide
    ctx.fillStyle = 'rgba(141, 27, 46, 0.2)';
    ctx.strokeStyle = '#8d1b2e';
    ctx.lineWidth = 2;
    ctx.fillRect(gratingX - 3, opticalAxisY - 35, 6, 70);
    ctx.strokeRect(gratingX - 3, opticalAxisY - 35, 6, 70);
    ctx.fillStyle = '#e57384';
    ctx.font = '9px sans-serif';
    ctx.fillText(`Grating`, gratingX, opticalAxisY - 40);
    ctx.fillText(`${linesPerMm} l/mm`, gratingX, opticalAxisY + 46);

    // Observation Screen line
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(screenX, opticalAxisY - 65);
    ctx.lineTo(screenX, opticalAxisY + 65);
    ctx.stroke();
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Screen', screenX, opticalAxisY - 70);

    // Diffracted rays from grating to screen
    for (const ord of ordersInfo) {
      if (!ord.exists) continue;
      // Ray target y on screen
      const yDisplacement = ord.n * 18; // schematic perspective
      const targetY = opticalAxisY - yDisplacement;

      ctx.strokeStyle = laserColor.hex;
      ctx.lineWidth = ord.n === 0 ? 2 : 1.2;
      ctx.beginPath();
      ctx.moveTo(gratingX, opticalAxisY);
      ctx.lineTo(screenX, targetY);
      ctx.stroke();

      // Order label on screen edge
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`n=${ord.n}`, screenX + 4, targetY + 3);
    }

    // Angle arc for order n = 1
    const order1 = ordersInfo.find((o) => o.n === 1);
    if (order1 && order1.exists) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(gratingX, opticalAxisY, 40, -order1.thetaRad * 0.45, 0, false);
      ctx.stroke();
      ctx.fillStyle = '#fbbf24';
      ctx.font = '10px sans-serif';
      ctx.fillText(`θ₁=${order1.thetaDeg.toFixed(1)}°`, gratingX + 50, opticalAxisY - 10);
    }

    // Distance D dimension line
    const dimY = schematicTop + 145;
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(gratingX, dimY);
    ctx.lineTo(screenX, dimY);
    ctx.moveTo(gratingX, dimY - 4);
    ctx.lineTo(gratingX, dimY + 4);
    ctx.moveTo(screenX, dimY - 4);
    ctx.lineTo(screenX, dimY + 4);
    ctx.stroke();
    ctx.fillStyle = '#8d1b2e';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Distance D = ${distanceM.toFixed(2)} m`, (gratingX + screenX) / 2, dimY - 5);

    // Divider line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, screenViewTop);
    ctx.lineTo(width, screenViewTop);
    ctx.stroke();

    // ─── 2. FRONT SCREEN VIEW WITH GLOWING SPOTS & RULER ───
    ctx.fillStyle = '#05050a';
    ctx.fillRect(0, screenViewTop, width, screenViewHeight);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Observation Screen View (Front)', 14, screenViewTop + 20);

    const screenCenterY = screenViewTop + 110;

    // Optical bench horizontal center line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, screenCenterY);
    ctx.lineTo(width - 20, screenCenterY);
    ctx.stroke();

    // Central crosshair mark at x = 0
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.moveTo(cx, screenCenterY - 30);
    ctx.lineTo(cx, screenCenterY + 30);
    ctx.stroke();

    // Render glowing diffraction spots (Gaussian blobs with sinc^2 brightness)
    for (const ord of ordersInfo) {
      if (!ord.exists) continue;

      const spotPxX = cx + ord.xMm * scalePxPerMm;

      if (!ord.isOnScreen || spotPxX < 15 || spotPxX > width - 15) {
        // Off-screen indicator tag
        ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
        ctx.font = '9px monospace';
        ctx.textAlign = ord.n > 0 ? 'right' : 'left';
        const tagX = ord.n > 0 ? width - 8 : 8;
        ctx.fillText(`n=${ord.n} off-screen`, tagX, screenCenterY - 45 + ord.n * 10);
        continue;
      }

      // Spot glow gradient
      const spotRadius = ord.n === 0 ? 14 : Math.max(5, 12 * Math.sqrt(ord.intensity));
      const grad = ctx.createRadialGradient(
        spotPxX,
        screenCenterY,
        0,
        spotPxX,
        screenCenterY,
        spotRadius * 2
      );

      const alpha = Math.min(1.0, Math.max(0.2, ord.intensity * 0.95));
      grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
      grad.addColorStop(0.2, `rgba(${laserColor.rgb}, ${alpha * 0.9})`);
      grad.addColorStop(0.6, `rgba(${laserColor.rgb}, ${alpha * 0.3})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(spotPxX, screenCenterY, spotRadius * 2, 0, Math.PI * 2);
      ctx.fill();

      // Spot label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`n=${ord.n}`, spotPxX, screenCenterY + 35);
      if (ord.n !== 0) {
        ctx.font = '9px monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`${ord.xMm.toFixed(1)}mm`, spotPxX, screenCenterY + 47);
      }
    }

    // Notice for orders that do not physically exist
    const nonExisting = ordersInfo.filter((o) => !o.exists);
    if (nonExisting.length > 0) {
      ctx.fillStyle = 'rgba(245, 158, 11, 0.85)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(
        `Orders ±${nonExisting.map((o) => Math.abs(o.n)).filter((v, i, a) => a.indexOf(v) === i).join(', ')} do not exist (|sin θ| > 1)`,
        width - 14,
        screenViewTop + 20
      );
    }

    // Draggable Measurement Ruler Overlay
    const rulerY = screenCenterY - 15;
    const rulerPxX = cx + rulerXMm * scalePxPerMm;

    // Millimeter scale line
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 280, rulerY);
    ctx.lineTo(cx + 280, rulerY);
    ctx.stroke();

    // Millimeter tick marks
    const maxVisibleMm = Math.floor(280 / scalePxPerMm);
    const tickStep = maxVisibleMm > 200 ? 50 : maxVisibleMm > 100 ? 20 : 10;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';

    for (let mm = -maxVisibleMm; mm <= maxVisibleMm; mm += tickStep) {
      const tx = cx + mm * scalePxPerMm;
      ctx.beginPath();
      ctx.moveTo(tx, rulerY - 4);
      ctx.lineTo(tx, rulerY + 4);
      ctx.stroke();
      if (mm % (tickStep * 2) === 0) {
        ctx.fillText(`${mm}`, tx, rulerY - 7);
      }
    }

    // Caliper crosshair cursor
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rulerPxX, screenCenterY - 45);
    ctx.lineTo(rulerPxX, screenCenterY + 45);
    ctx.stroke();

    // Top and bottom grip handles
    ctx.fillStyle = '#8d1b2e';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(rulerPxX, screenCenterY - 45, 5, 0, Math.PI * 2);
    ctx.arc(rulerPxX, screenCenterY + 45, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Readout badge
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(rulerPxX - 45, screenCenterY - 70, 90, 20);
    ctx.strokeStyle = '#8d1b2e';
    ctx.strokeRect(rulerPxX - 45, screenCenterY - 70, 90, 20);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`x = ${rulerXMm.toFixed(1)} mm`, rulerPxX, screenCenterY - 56);

    // ─── 3. INTENSITY-VS-POSITION PLOT ───
    ctx.fillStyle = '#080812';
    ctx.fillRect(0, plotTop, width, plotHeight);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, plotTop);
    ctx.lineTo(width, plotTop);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Intensity Profile I(x) on Screen', 14, plotTop + 16);

    const baselineY = height - 20;
    const maxPlotH = plotHeight - 35;

    // Baseline
    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(20, baselineY);
    ctx.lineTo(width - 20, baselineY);
    ctx.stroke();

    // Analytical intensity curve: sinc^2 envelope modulation with sharp order peaks
    ctx.strokeStyle = laserColor.hex;
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    let started = false;
    for (let px = 20; px <= width - 20; px += 2) {
      const xMm = (px - cx) / scalePxPerMm;
      // Synthesize intensity: background single-slit envelope + peaks at order positions
      let totalI = 0;
      for (const ord of ordersInfo) {
        if (!ord.exists) continue;
        const dx = xMm - ord.xMm;
        const peakWidthMm = 3.0; // diffraction spot width
        const gaussian = Math.exp(-(dx * dx) / (2 * peakWidthMm * peakWidthMm));
        totalI += ord.intensity * gaussian;
      }
      totalI = Math.min(1.0, totalI);

      const py = baselineY - totalI * maxPlotH;
      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
  }, [
    ordersInfo,
    scalePxPerMm,
    rulerXMm,
    distanceM,
    linesPerMm,
    laserColor,
  ]);

  // Pointer drag events for ruler
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isReadOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const px = (e.clientX - rect.left) * scaleX;
    const cx = canvas.width / 2;
    const xMm = (px - cx) / scalePxPerMm;

    if (Math.abs(xMm - rulerXMm) < 25) {
      setIsDragging(true);
      (e.target as Element).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging || isReadOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const px = (e.clientX - rect.left) * scaleX;
    const cx = canvas.width / 2;
    const xMm = Number(((px - cx) / scalePxPerMm).toFixed(1));
    setRulerXMm(xMm);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h4 className={styles.title}>Diffraction Apparatus & Screen View</h4>
        <div className={styles.btnGroup}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Snap to Order:</span>
          {[-3, -2, -1, 1, 2, 3].map((order) => {
            const ordInfo = ordersInfo.find((o) => o.n === order);
            const isAvailable = ordInfo?.exists && ordInfo.isOnScreen;
            return (
              <button
                key={order}
                type="button"
                className={styles.button}
                onClick={() => handleSnapToOrder(order)}
                disabled={!isAvailable || isReadOnly}
                title={
                  !ordInfo?.exists
                    ? 'Does not exist (|sin θ| > 1)'
                    : !ordInfo.isOnScreen
                    ? 'Falls off-screen'
                    : `Snap ruler to order n = ${order}`
                }
              >
                {order > 0 ? `+${order}` : order}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.canvasWrap}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>

      <div className={styles.readoutBar}>
        <div>
          <span>Ruler Position: </span>
          <span className={styles.measureVal}>x = {rulerXMm.toFixed(1)} mm</span>{' '}
          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
            (|x| = {Math.abs(rulerXMm).toFixed(1)} mm)
          </span>
        </div>

        {onRecordOrder && (
          <div className={styles.btnGroup}>
            {[-3, -2, -1, 1, 2, 3].map((n) => {
              const ordInfo = ordersInfo.find((o) => o.n === n);
              return (
                <button
                  key={n}
                  type="button"
                  className={`${styles.button} ${styles.primaryBtn}`}
                  onClick={() => onRecordOrder(n, rulerXMm)}
                  disabled={!ordInfo?.exists || isReadOnly}
                >
                  Record as n={n > 0 ? `+${n}` : n}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <p className={styles.caption}>
        Tip: Drag the sky-blue caliper along the screen view to read spot displacement xₙ, or use the quick "Snap to Order" buttons.
      </p>
    </div>
  );
}
