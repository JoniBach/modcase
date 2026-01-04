import { parseValueWithUnit, type Unit } from './units';

export type AnchorPreset =
	| 'center'
	| 'top-left'
	| 'top-center'
	| 'top-right'
	| 'center-left'
	| 'center-right'
	| 'bottom-left'
	| 'bottom-center'
	| 'bottom-right';

export interface AnchorPoint {
	x: number;
	y: number;
}

export type AnchorValue =
	| AnchorPreset
	| { x: number | string; y: number | string; unit?: Unit }
	| [number | string, number | string];

const ANCHOR_PRESETS: Record<AnchorPreset, AnchorPoint> = {
	'bottom-left': { x: 0, y: 0 },
	'bottom-center': { x: 50, y: 0 },
	'bottom-right': { x: 100, y: 0 },
	'center-left': { x: 0, y: 50 },
	center: { x: 50, y: 50 },
	'center-right': { x: 100, y: 50 },
	'top-left': { x: 0, y: 100 },
	'top-center': { x: 50, y: 100 },
	'top-right': { x: 100, y: 100 }
};

export interface ParsedAnchor {
	xPercent: number;
	yPercent: number;
	xAbsolute: number;
	yAbsolute: number;
	isPercentage: boolean;
}

export function parseAnchor(anchor: AnchorValue | undefined, unit?: Unit): ParsedAnchor {
	if (!anchor) {
		return {
			xPercent: 50,
			yPercent: 50,
			xAbsolute: 0,
			yAbsolute: 0,
			isPercentage: true
		};
	}

	if (typeof anchor === 'string') {
		const preset = ANCHOR_PRESETS[anchor as AnchorPreset];
		if (preset) {
			return {
				xPercent: preset.x,
				yPercent: preset.y,
				xAbsolute: 0,
				yAbsolute: 0,
				isPercentage: true
			};
		}
	}

	if (Array.isArray(anchor)) {
		const [x, y] = anchor;
		return parseAnchorCoordinates(x, y, unit);
	}

	if (typeof anchor === 'object' && 'x' in anchor && 'y' in anchor) {
		return parseAnchorCoordinates(anchor.x, anchor.y, anchor.unit || unit);
	}

	return {
		xPercent: 0,
		yPercent: 100,
		xAbsolute: 0,
		yAbsolute: 0,
		isPercentage: true
	};
}

function parseAnchorCoordinates(x: number | string, y: number | string, unit?: Unit): ParsedAnchor {
	const xValue = parseAnchorValue(x, unit);
	const yValue = parseAnchorValue(y, unit);

	const isPercentage = xValue.isPercentage && yValue.isPercentage;

	return {
		xPercent: xValue.isPercentage ? xValue.value : 0,
		yPercent: yValue.isPercentage ? yValue.value : 0,
		xAbsolute: xValue.isPercentage ? 0 : xValue.valueInMM,
		yAbsolute: yValue.isPercentage ? 0 : yValue.valueInMM,
		isPercentage
	};
}

function parseAnchorValue(
	value: number | string,
	unit?: Unit
): { value: number; valueInMM: number; isPercentage: boolean } {
	if (typeof value === 'number') {
		if (value >= 0 && value <= 100) {
			return { value, valueInMM: 0, isPercentage: true };
		}
		const parsed = parseValueWithUnit(value, unit);
		return { value, valueInMM: parsed.valueInMM, isPercentage: false };
	}

	const trimmed = value.trim();

	if (trimmed.endsWith('%')) {
		const percentValue = parseFloat(trimmed.slice(0, -1));
		if (!isNaN(percentValue)) {
			return { value: percentValue, valueInMM: 0, isPercentage: true };
		}
	}

	const parsed = parseValueWithUnit(value, unit);
	return { value: parsed.value, valueInMM: parsed.valueInMM, isPercentage: false };
}

export function calculateAnchorOffset(
	anchor: ParsedAnchor,
	width: number,
	height: number
): { offsetX: number; offsetY: number } {
	if (anchor.isPercentage) {
		return {
			offsetX: (width * anchor.xPercent) / 100,
			offsetY: (height * anchor.yPercent) / 100
		};
	}

	return {
		offsetX: anchor.xAbsolute,
		offsetY: anchor.yAbsolute
	};
}

export const anchorSystem = {
	parse: parseAnchor,
	calculateOffset: calculateAnchorOffset,
	presets: Object.keys(ANCHOR_PRESETS) as AnchorPreset[]
};
