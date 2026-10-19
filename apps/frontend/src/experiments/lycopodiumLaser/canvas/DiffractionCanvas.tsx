import { useEffect, useRef, useState, useCallback } from 'react';
import {
  airyIntensity,
  SAMPLE_DIAMETERS,
  WAVELENGTH_PRESETS,
  darkRingRadius,
} from '../physics/lycopodium';
import type { SampleKey } from '../sim/types';
import styles from './DiffractionCanvas.module.css';

interface DiffractionCanvasProps {
  wavelengthM: number;
  distanceM: number;
  sampleKey: SampleKey;
  onRecordRing?: (orderN: number, diameterMm: number) => void;
  isReadOnly?: boolean;
}

const SCALE_PX_PER_MM = 2.0; // 1 mm = 2.0 px on canvas

export function DiffractionCanvas({
  wavelengthM,
  distanceM,
  sampleKey,
  onRecordRing,
  isReadOnly = false,
}: DiffractionCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Caliper measurement markers in mm relative to center (0 mm)
  const [leftMarkerMm, setLeftMarkerMm] = useState(-25.0);
  const [rightMarkerMm, setRightMarkerMm] = useState(25.0);
  const [activeDrag, setActiveDrag] = useState<'left' | 'right' | 'both' | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartLeft, setDragStartLeft] = useState(-25.0);
  const [dragStartRight, setDragStartRight] = useState(25.0);

  const trueDiameterM = SAMPLE_DIAMETERS[sampleKey];
  const isRed = wavelengthM >= WAVELENGTH_PRESETS.RED - 10e-9;
  const laserColor = isRed ? '#ef4444' : '#10b981';

  const measuredDiameterMm = Math.abs(rightMarkerMm - leftMarkerMm);
  const measuredRadiusMm = measuredDiameterMm / 2;

  // Snap ruler to theoretical ring n
  const handleSnapToRing = useCallback(
    (orderN: number) => {
      const rM = darkRingRadius(orderN, wavelengthM, distanceM, trueDiameterM);
      const rMm = rM * 1000;
      const rounded = Number(rMm.toFixed(1));
      setLeftMarkerMm(-rounded);
      setRightMarkerMm(rounded);
    },
    [wavelengthM, distanceM, trueDiameterM]
  );

  // Slider change for diameter 2r
  const handleSliderDiameterChange = useCallback((newDiamMm: number) => {
    const half = Number((newDiamMm / 2).toFixed(1));
    setLeftMarkerMm(-half);
    setRightMarkerMm(half);
  }, []);

  // Render canvas frame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 640;
    const height = 480;
    canvas.width = width;
    canvas.height = height;

    const patternHeight = 350;
    const schematicHeight = 130;
    const cx = width / 2;
    const cy = patternHeight / 2;

    // 1. Dark Screen Background
    ctx.fillStyle = '#06060c';
    ctx.fillRect(0, 0, width, patternHeight);

    // 2. Compute Radial Intensity LUT with logarithmic compression
    const maxRadiusPx = Math.ceil(Math.hypot(cx, cy));
    const lut = new Float32Array(maxRadiusPx + 1);

    for (let rPx = 0; rPx <= maxRadiusPx; rPx++) {
      const rM = (rPx / SCALE_PX_PER_MM) * 1e-3;
      const theta = Math.atan(rM / distanceM);
      const rawIntensity = airyIntensity(theta, trueDiameterM, wavelengthM);
      // High dynamic range log compression so outer dark rings (n=2,3,4) are clearly distinguishable
      const logI = Math.log(1 + 180 * Math.max(0, rawIntensity)) / Math.log(181);
      lut[rPx] = Math.pow(logI, 0.6);
    }

    // 3. Render Airy rings using ImageData
    const imgData = ctx.createImageData(width, patternHeight);
    const data = imgData.data;

    const rFactor = isRed ? 255 : 30;
    const gFactor = isRed ? 40 : 255;
    const bFactor = isRed ? 40 : 85;

    for (let py = 0; py < patternHeight; py++) {
      const dy = py - cy;
      const dy2 = dy * dy;
      const rowOffset = py * width * 4;

      for (let px = 0; px < width; px++) {
        const dx = px - cx;
        const rPx = Math.round(Math.sqrt(dx * dx + dy2));
        const intensity = rPx <= maxRadiusPx ? lut[rPx] : 0;
        const idx = rowOffset + px * 4;

        data[idx] = Math.round(rFactor * intensity);
        data[idx + 1] = Math.round(gFactor * intensity);
        data[idx + 2] = Math.round(bFactor * intensity);
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // 4. Circular Caliper Target Ring (Guides diameter alignment)
    const currentRadiusPx = measuredRadiusMm * SCALE_PX_PER_MM;
    if (currentRadiusPx > 2 && currentRadiusPx < patternHeight) {
      ctx.save();
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, currentRadiusPx, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 5. Center Reference Crosshair
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 15, cy);
    ctx.lineTo(cx + 15, cy);
    ctx.moveTo(cx, cy - 15);
    ctx.lineTo(cx, cy + 15);
    ctx.stroke();

    // 6. Millimeter Graticule / Ruler Scale
    const rulerY = cy;
    const leftPx = cx + leftMarkerMm * SCALE_PX_PER_MM;
    const rightPx = cx + rightMarkerMm * SCALE_PX_PER_MM;

    // Measurement diameter span line
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(leftPx, rulerY);
    ctx.lineTo(rightPx, rulerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Millimeter tick marks
    const maxMm = 80;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';

    for (let mm = -maxMm; mm <= maxMm; mm++) {
      const tx = cx + mm * SCALE_PX_PER_MM;
      if (tx < 10 || tx > width - 10) continue;

      if (mm % 10 === 0) {
        // Major 10 mm tick
        ctx.beginPath();
        ctx.moveTo(tx, rulerY - 7);
        ctx.lineTo(tx, rulerY + 7);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        if (Math.abs(mm) % 20 === 0) {
          ctx.fillText(`${mm}`, tx, rulerY + 19);
        }
      } else if (mm % 5 === 0) {
        // Medium 5 mm tick
        ctx.beginPath();
        ctx.moveTo(tx, rulerY - 4);
        ctx.lineTo(tx, rulerY + 4);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (Math.abs(mm) <= 50) {
        // Minor 1 mm tick
        ctx.beginPath();
        ctx.moveTo(tx, rulerY - 2.5);
        ctx.lineTo(tx, rulerY + 2.5);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }

    // Left Caliper Crosshair Jaw (Gold with maroon grips)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(leftPx, cy - 85);
    ctx.lineTo(leftPx, cy + 85);
    ctx.stroke();

    ctx.fillStyle = '#8d1b2e';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(leftPx, cy - 85, 6, 0, Math.PI * 2);
    ctx.arc(leftPx, cy + 85, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Right Caliper Crosshair Jaw
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rightPx, cy - 85);
    ctx.lineTo(rightPx, cy + 85);
    ctx.stroke();

    ctx.fillStyle = '#8d1b2e';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(rightPx, cy - 85, 6, 0, Math.PI * 2);
    ctx.arc(rightPx, cy + 85, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Measurement badge above diameter line
    const badgeX = (leftPx + rightPx) / 2;
    const badgeY = cy - 16;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(badgeX - 52, badgeY - 12, 104, 22);
    ctx.strokeStyle = '#8d1b2e';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(badgeX - 52, badgeY - 12, 104, 22);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`2r = ${measuredDiameterMm.toFixed(1)} mm`, badgeX, badgeY + 3);

    // 7. Side Schematic Diagram (Optical bench layout)
    ctx.fillStyle = '#10101a';
    ctx.fillRect(0, patternHeight, width, schematicHeight);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, patternHeight);
    ctx.lineTo(width, patternHeight);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Optical Bench Side Profile (Schematic)', 16, patternHeight + 20);

    const benchY = patternHeight + 95;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, benchY);
    ctx.lineTo(width - 40, benchY);
    ctx.stroke();

    // Laser module
    const laserX = 60;
    const laserY = benchY - 35;
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#475569';
    ctx.fillRect(laserX, laserY, 60, 25);
    ctx.strokeRect(laserX, laserY, 60, 25);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Laser', laserX + 30, laserY + 16);

    // Lycopodium powder slide
    const slideX = 220;
    const slideY = benchY - 45;
    ctx.fillStyle = 'rgba(141, 27, 46, 0.25)';
    ctx.strokeStyle = '#8d1b2e';
    ctx.lineWidth = 1.5;
    ctx.fillRect(slideX, slideY, 10, 45);
    ctx.strokeRect(slideX, slideY, 10, 45);
    ctx.fillStyle = '#e57384';
    ctx.font = '10px sans-serif';
    ctx.fillText('Powder Slide', slideX + 5, slideY - 8);

    // Screen
    const screenX = width - 80;
    const screenY = benchY - 55;
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#64748b';
    ctx.fillRect(screenX, screenY, 8, 65);
    ctx.strokeRect(screenX, screenY, 8, 65);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px sans-serif';
    ctx.fillText('Screen', screenX + 4, screenY - 8);

    // Laser beam
    ctx.strokeStyle = laserColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(laserX + 60, laserY + 12.5);
    ctx.lineTo(slideX, laserY + 12.5);
    ctx.stroke();

    // Conical diffraction cone
    ctx.fillStyle = isRed ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)';
    ctx.beginPath();
    ctx.moveTo(slideX + 10, laserY + 12.5);
    ctx.lineTo(screenX, screenY + 5);
    ctx.lineTo(screenX, screenY + 60);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = laserColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(slideX + 10, laserY + 12.5);
    ctx.lineTo(screenX, screenY + 5);
    ctx.moveTo(slideX + 10, laserY + 12.5);
    ctx.lineTo(screenX, screenY + 60);
    ctx.stroke();

    // Distance D dimension
    const dimY = benchY + 18;
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(slideX + 5, dimY);
    ctx.lineTo(screenX + 4, dimY);
    ctx.moveTo(slideX + 5, dimY - 4);
    ctx.lineTo(slideX + 5, dimY + 4);
    ctx.moveTo(screenX + 4, dimY - 4);
    ctx.lineTo(screenX + 4, dimY + 4);
    ctx.stroke();

    ctx.fillStyle = '#8d1b2e';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Distance D = ${distanceM.toFixed(2)} m`, (slideX + screenX) / 2, dimY - 5);
  }, [
    wavelengthM,
    distanceM,
    trueDiameterM,
    isRed,
    laserColor,
    leftMarkerMm,
    rightMarkerMm,
    measuredDiameterMm,
    measuredRadiusMm,
  ]);

  // Pointer drag events for caliper crosshairs
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isReadOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const px = (e.clientX - rect.left) * scaleX;
    const cx = canvas.width / 2;
    const xMm = (px - cx) / SCALE_PX_PER_MM;

    const distToLeft = Math.abs(xMm - leftMarkerMm);
    const distToRight = Math.abs(xMm - rightMarkerMm);
    const centerMm = (leftMarkerMm + rightMarkerMm) / 2;
    const distToCenter = Math.abs(xMm - centerMm);

    setDragStartX(xMm);
    setDragStartLeft(leftMarkerMm);
    setDragStartRight(rightMarkerMm);

    if (distToLeft < 15 && distToLeft <= distToRight) {
      setActiveDrag('left');
      (e.target as Element).setPointerCapture(e.pointerId);
    } else if (distToRight < 15) {
      setActiveDrag('right');
      (e.target as Element).setPointerCapture(e.pointerId);
    } else if (distToCenter < 20 || (xMm > leftMarkerMm && xMm < rightMarkerMm)) {
      setActiveDrag('both');
      (e.target as Element).setPointerCapture(e.pointerId);
    } else {
      // Click anywhere to reposition nearest jaw
      if (xMm < 0) {
        setLeftMarkerMm(Number(xMm.toFixed(1)));
        setActiveDrag('left');
      } else {
        setRightMarkerMm(Number(xMm.toFixed(1)));
        setActiveDrag('right');
      }
      (e.target as Element).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!activeDrag || isReadOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const px = (e.clientX - rect.left) * scaleX;
    const cx = canvas.width / 2;
    const xMm = Number(((px - cx) / SCALE_PX_PER_MM).toFixed(1));

    if (activeDrag === 'left') {
      const clamped = Math.min(xMm, -1.0);
      setLeftMarkerMm(clamped);
      // Keep symmetric measurement for convenience
      setRightMarkerMm(Math.abs(clamped));
    } else if (activeDrag === 'right') {
      const clamped = Math.max(xMm, 1.0);
      setRightMarkerMm(clamped);
      setLeftMarkerMm(-clamped);
    } else if (activeDrag === 'both') {
      const delta = xMm - dragStartX;
      setLeftMarkerMm(Number((dragStartLeft + delta).toFixed(1)));
      setRightMarkerMm(Number((dragStartRight + delta).toFixed(1)));
    }
  };

  const handlePointerUp = () => {
    setActiveDrag(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h4 className={styles.title}>Diffraction Screen & Measurement Ruler</h4>
        <div className={styles.btnGroup}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Snap to Ring:</span>
          {[1, 2, 3, 4].map((order) => (
            <button
              key={order}
              type="button"
              className={styles.button}
              onClick={() => handleSnapToRing(order)}
              disabled={isReadOnly}
            >
              Ring {order}
            </button>
          ))}
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

      {/* Interactive Diameter Slider */}
      <div className={styles.sliderControlRow}>
        <label htmlFor="caliper-slider" className={styles.sliderLabel}>
          Caliper Diameter (2r):
        </label>
        <input
          id="caliper-slider"
          type="range"
          min="10"
          max="120"
          step="0.5"
          value={measuredDiameterMm}
          onChange={(e) => handleSliderDiameterChange(Number(e.target.value))}
          disabled={isReadOnly}
          className={styles.rangeSlider}
        />
        <span className={styles.sliderVal}>{measuredDiameterMm.toFixed(1)} mm</span>
      </div>

      <div className={styles.readoutBar}>
        <div>
          <span>Ruler Caliper: </span>
          <span className={styles.measureVal}>
            Diameter 2r = {measuredDiameterMm.toFixed(1)} mm
          </span>{' '}
          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
            (Radius r = {measuredRadiusMm.toFixed(1)} mm)
          </span>
        </div>

        {onRecordRing && (
          <div className={styles.btnGroup}>
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                className={`${styles.button} ${styles.primaryBtn}`}
                onClick={() => onRecordRing(n, measuredDiameterMm)}
                disabled={isReadOnly}
              >
                Record as Ring {n}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className={styles.caption}>
        Tip: Drag the caliper jaws across any dark circular band, use the slider to fine-tune the diameter, or click &quot;Snap to Ring&quot;. Then click &quot;Record as Ring n&quot; to populate your observation table.
      </p>
    </div>
  );
}
