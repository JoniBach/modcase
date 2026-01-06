import { tools } from './tools';
import { parseValueWithUnit } from './units';

const extrusion = (params: {
	size?: string;
	outerSlotWidth?: string;
	innerCavityWidth?: string;
	wallThickness?: string;
	webDepth?: string;
	boreRadius?: string;
}) => {
	const { size, outerSlotWidth, innerCavityWidth, wallThickness, webDepth, boreRadius } = params;

	const sizeParsed = parseValueWithUnit(size!);
	const centerPos = sizeParsed.valueInMM / 2;

	return tools.json({
		operation: 'subtract',
		ops: [
			// OUTER PROFILE
			{
				shape: 'rectangle',
				params: { width: size, height: size, x: '0', y: '0' },
				id: 'outerProfile',
				anchor: { x: 0, y: 0 },
				unit: 'mm'
			},

			// CENTRAL BORE
			{
				shape: 'circle',
				params: { radius: boreRadius, x: centerPos, y: centerPos },
				id: 'centralBore',
				unit: 'mm',
				relativeTo: 'outerProfile',
				anchor: { x: 50, y: 50 }
			},

			// ───── TOP SLOT ─────
			{
				shape: 'rectangle',
				params: {
					width: innerCavityWidth,
					height: wallThickness,
					x: centerPos,
					y: size
				},
				id: 'topInnerWall',
				anchor: 'top-center',
				unit: 'mm',
				relativeTo: 'outerProfile'
			},
			{
				shape: 'rectangle',
				params: {
					width: outerSlotWidth,
					height: wallThickness,
					x: '0',
					y: `-${wallThickness}`
				},
				id: 'topOuterWall',
				anchor: 'top-center',
				unit: 'mm',
				relativeTo: 'topInnerWall'
			},
			{
				shape: 'trapezoidY',
				params: {
					bottomWidth: innerCavityWidth,
					topWidth: outerSlotWidth,
					height: webDepth,
					x: '0',
					y: `-${wallThickness}`
				},
				id: 'topWeb',
				anchor: 'top-center',
				unit: 'mm',
				relativeTo: 'topOuterWall'
			},

			// ───── BOTTOM SLOT ─────
			{
				shape: 'rectangle',
				params: {
					width: innerCavityWidth,
					height: wallThickness,
					x: centerPos,
					y: '0'
				},
				id: 'bottomInnerWall',
				anchor: 'bottom-center',
				unit: 'mm',
				relativeTo: 'outerProfile'
			},
			{
				shape: 'rectangle',
				params: {
					width: outerSlotWidth,
					height: wallThickness,
					x: '0',
					y: wallThickness
				},
				id: 'bottomOuterWall',
				anchor: 'bottom-center',
				unit: 'mm',
				relativeTo: 'bottomInnerWall'
			},
			{
				shape: 'trapezoidY',
				params: {
					bottomWidth: outerSlotWidth,
					topWidth: innerCavityWidth,
					height: webDepth,
					x: '0',
					y: wallThickness
				},
				id: 'bottomWeb',
				anchor: 'bottom-center',
				unit: 'mm',
				relativeTo: 'bottomOuterWall'
			},

			// ───── LEFT SLOT ─────
			{
				shape: 'rectangle',
				params: {
					width: wallThickness,
					height: innerCavityWidth,
					x: '0',
					y: centerPos
				},
				id: 'leftInnerWall',
				anchor: 'left-center',
				unit: 'mm',
				relativeTo: 'outerProfile'
			},
			{
				shape: 'rectangle',
				params: {
					width: wallThickness,
					height: outerSlotWidth,
					x: wallThickness,
					y: '0'
				},
				id: 'leftOuterWall',
				anchor: 'left-center',
				unit: 'mm',
				relativeTo: 'leftInnerWall'
			},
			{
				shape: 'trapezoidX',
				params: {
					width: webDepth,
					leftHeight: outerSlotWidth,
					rightHeight: innerCavityWidth,
					x: wallThickness,
					y: '0',
					orientation: 'horizontal'
				},
				id: 'leftWeb',
				anchor: 'left-center',
				unit: 'mm',
				relativeTo: 'leftOuterWall'
			},

			// ───── RIGHT SLOT ─────
			{
				shape: 'rectangle',
				params: {
					width: wallThickness,
					height: innerCavityWidth,
					x: size,
					y: centerPos
				},
				id: 'rightInnerWall',
				anchor: 'right-center',
				unit: 'mm',
				relativeTo: 'outerProfile'
			},
			{
				shape: 'rectangle',
				params: {
					width: wallThickness,
					height: outerSlotWidth,
					x: `-${wallThickness}`,
					y: '0'
				},
				id: 'rightOuterWall',
				anchor: 'right-center',
				unit: 'mm',
				relativeTo: 'rightInnerWall'
			},
			{
				shape: 'trapezoidX',
				params: {
					width: webDepth,
					leftHeight: innerCavityWidth,
					rightHeight: outerSlotWidth,
					x: `-${wallThickness}`,
					y: '0',
					orientation: 'horizontal'
				},
				id: 'rightWeb',
				anchor: 'right-center',
				unit: 'mm',
				relativeTo: 'rightOuterWall'
			}
		]
	});
};

export const pattern = { extrusion };
