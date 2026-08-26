import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { getColorForLanguage } from '../utils/colors';

export interface CanvasScatterPoint {
  x: number;
  y: number;
  language: string;
  repositorio?: string;
  url?: string;
}

interface CanvasScatterChartProps {
  data: CanvasScatterPoint[];
  xLabel: string;
  yLabel: string;
  xUnit?: string;
  yUnit?: string;
  xFormatter?: (val: number) => string;
  yFormatter?: (val: number) => string;
  height?: number;
}

export function CanvasScatterChart({
  data,
  xLabel,
  yLabel,
  xUnit = '',
  yUnit = '',
  xFormatter = (v) => new Intl.NumberFormat('pt-BR').format(v),
  yFormatter = (v) => new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(v),
  height = 500
}: CanvasScatterChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [dimensions, setDimensions] = useState({ width: 800, height });
  const [hoveredPoint, setHoveredPoint] = useState<{
    point: CanvasScatterPoint;
    canvasX: number;
    canvasY: number;
  } | null>(null);

  // Measure container size
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setDimensions({
            width: Math.floor(entry.contentRect.width),
            height: height
          });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [height]);

  // Compute min/max domains
  const { minX, maxX, minY, maxY } = useMemo(() => {
    if (data.length === 0) return { minX: 0, maxX: 100, minY: 0, maxY: 100 };
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (let i = 0; i < data.length; i++) {
      const p = data[i];
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    if (minX === Infinity) minX = 0;
    if (maxX === -Infinity) maxX = 10;
    if (minY === Infinity) minY = 0;
    if (maxY === -Infinity) maxY = 10;

    // Start minX from 0 if close to 0
    if (minX > 0 && minX < 5) minX = 0;
    if (minY > 0 && minY < 5) minY = 0;

    // Add 5% padding to top/right
    maxX = maxX + (maxX - minX) * 0.05 || 10;
    maxY = maxY + (maxY - minY) * 0.05 || 10;

    return { minX, maxX, minY, maxY };
  }, [data]);

  const padding = { top: 30, right: 30, bottom: 55, left: 70 };
  const plotWidth = Math.max(10, dimensions.width - padding.left - padding.right);
  const plotHeight = Math.max(10, dimensions.height - padding.top - padding.bottom);

  // Coordinate conversion
  const getCanvasX = useCallback((x: number) => {
    const range = maxX - minX || 1;
    return padding.left + ((x - minX) / range) * plotWidth;
  }, [minX, maxX, padding.left, plotWidth]);

  const getCanvasY = useCallback((y: number) => {
    const range = maxY - minY || 1;
    return padding.top + plotHeight - ((y - minY) / range) * plotHeight;
  }, [minY, maxY, padding.top, plotHeight]);

  // Render on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // 1. Draw Grid Lines & Ticks
    const numYTicks = 5;
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= numYTicks; i++) {
      const val = minY + (i / numYTicks) * (maxY - minY);
      const yPos = padding.top + plotHeight - (i / numYTicks) * plotHeight;

      // Grid line
      ctx.beginPath();
      ctx.moveTo(padding.left, yPos);
      ctx.lineTo(padding.left + plotWidth, yPos);
      ctx.stroke();

      // Label
      ctx.fillText(yFormatter(val), padding.left - 8, yPos);
    }

    const numXTicks = Math.min(8, Math.max(4, Math.floor(plotWidth / 90)));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let i = 0; i <= numXTicks; i++) {
      const val = minX + (i / numXTicks) * (maxX - minX);
      const xPos = padding.left + (i / numXTicks) * plotWidth;

      // Grid line
      ctx.beginPath();
      ctx.moveTo(xPos, padding.top);
      ctx.lineTo(xPos, padding.top + plotHeight);
      ctx.stroke();

      // Label
      ctx.fillText(xFormatter(val), xPos, padding.top + plotHeight + 8);
    }

    // 2. Draw Axes Lines
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + plotHeight);
    ctx.lineTo(padding.left + plotWidth, padding.top + plotHeight);
    ctx.stroke();

    // 3. Axis Labels
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(xLabel + (xUnit ? ` (${xUnit})` : ''), padding.left + plotWidth / 2, dimensions.height - 10);

    ctx.save();
    ctx.translate(18, padding.top + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(yLabel + (yUnit ? ` (${yUnit})` : ''), 0, 0);
    ctx.restore();

    // 4. Draw All 200k Points via High-Speed Canvas Batching
    if (data.length === 0) return;

    // Group by language to minimize fillStyle switches
    const pointsByLang: Record<string, { xArr: Float32Array; yArr: Float32Array; count: number }> = {};
    for (let i = 0; i < data.length; i++) {
      const lang = data[i].language || 'Desconhecida';
      if (!pointsByLang[lang]) {
        pointsByLang[lang] = {
          xArr: new Float32Array(Math.min(data.length, 50000)),
          yArr: new Float32Array(Math.min(data.length, 50000)),
          count: 0
        };
      }
      const item = pointsByLang[lang];
      if (item.count >= item.xArr.length) {
        const newX = new Float32Array(item.xArr.length * 2);
        const newY = new Float32Array(item.yArr.length * 2);
        newX.set(item.xArr);
        newY.set(item.yArr);
        item.xArr = newX;
        item.yArr = newY;
      }
      item.xArr[item.count] = getCanvasX(data[i].x);
      item.yArr[item.count] = getCanvasY(data[i].y);
      item.count++;
    }

    // Alpha blending: dense areas appear darker/vibrant, outliers are subtle
    ctx.globalAlpha = data.length > 50000 ? 0.25 : data.length > 10000 ? 0.35 : 0.6;
    const pointRadius = data.length > 50000 ? 2 : data.length > 10000 ? 2.5 : 3.5;

    for (const lang in pointsByLang) {
      const { xArr, yArr, count } = pointsByLang[lang];
      ctx.fillStyle = getColorForLanguage(lang);
      ctx.beginPath();
      for (let i = 0; i < count; i++) {
        const cx = xArr[i];
        const cy = yArr[i];
        ctx.moveTo(cx + pointRadius, cy);
        ctx.arc(cx, cy, pointRadius, 0, Math.PI * 2);
      }
      ctx.fill();
    }

    // Reset alpha
    ctx.globalAlpha = 1.0;

  }, [data, dimensions, minX, maxX, minY, maxY, plotWidth, plotHeight, padding, xLabel, yLabel, xUnit, yUnit, xFormatter, yFormatter, getCanvasX, getCanvasY]);

  // Fast mouse hover search (sampled or nearest point)
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (data.length === 0 || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (
      mouseX < padding.left ||
      mouseX > padding.left + plotWidth ||
      mouseY < padding.top ||
      mouseY > padding.top + plotHeight
    ) {
      setHoveredPoint(null);
      return;
    }

    // Search closest point within 12px
    let closest: CanvasScatterPoint | null = null;
    let minDistanceSq = 12 * 12;
    let closestCanvasX = 0;
    let closestCanvasY = 0;

    // Scan loop (fast linear check on coordinates)
    const step = Math.max(1, Math.floor(data.length / 30000));
    for (let i = 0; i < data.length; i += step) {
      const p = data[i];
      const cx = getCanvasX(p.x);
      const cy = getCanvasY(p.y);
      const distSq = (cx - mouseX) ** 2 + (cy - mouseY) ** 2;
      if (distSq < minDistanceSq) {
        minDistanceSq = distSq;
        closest = p;
        closestCanvasX = cx;
        closestCanvasY = cy;
      }
    }

    if (closest) {
      setHoveredPoint({
        point: closest,
        canvasX: closestCanvasX,
        canvasY: closestCanvasY
      });
    } else {
      setHoveredPoint(null);
    }
  }, [data, getCanvasX, getCanvasY, padding.left, padding.top, plotWidth, plotHeight]);

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  const handleClick = useCallback(() => {
    if (hoveredPoint?.point.url) {
      window.open(hoveredPoint.point.url, '_blank', 'noopener,noreferrer');
    }
  }, [hoveredPoint]);

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden select-none">
      <div className="flex justify-between items-center text-xs text-gray-500 mb-2 px-1">
        <span>Exibindo <strong>{data.length.toLocaleString('pt-BR')}</strong> repositórios (100% dos dados)</span>
        <span className="italic">Densidade visual por Alpha Blending</span>
      </div>

      <canvas
        ref={canvasRef}
        style={{ width: dimensions.width, height: dimensions.height }}
        className="cursor-pointer block rounded-lg bg-white"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      />

      {hoveredPoint && (
        <div
          className="absolute z-30 pointer-events-none bg-white p-2.5 border border-gray-300 shadow-xl rounded-md text-xs font-sans"
          style={{
            left: Math.min(dimensions.width - 180, hoveredPoint.canvasX + 15),
            top: Math.max(10, hoveredPoint.canvasY - 50)
          }}
        >
          <div className="flex items-center gap-1.5 font-bold text-gray-800 border-b pb-1 mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: getColorForLanguage(hoveredPoint.point.language) }}
            />
            <span>{hoveredPoint.point.repositorio || hoveredPoint.point.language || 'Desconhecida'}</span>
          </div>
          <div className="text-gray-600">
            <p><span className="font-medium text-gray-700">{xLabel}:</span> {xFormatter(hoveredPoint.point.x)} {xUnit}</p>
            <p><span className="font-medium text-gray-700">{yLabel}:</span> {yFormatter(hoveredPoint.point.y)} {yUnit}</p>
          </div>
          {hoveredPoint.point.url && <p className="mt-1 text-blue-600 font-medium">Clique para abrir o repositório</p>}
        </div>
      )}
    </div>
  );
}
