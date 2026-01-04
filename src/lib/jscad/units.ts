export type Unit = 'mm' | 'in' | 'cm' | 'm' | 'ft';

export interface UnitConfig {
	defaultUnit: Unit;
	gridSpacing: number;
}

export const unitsList: Unit[] = ['mm', 'cm', 'm', 'in', 'ft'];

const UNIT_TO_MM: Record<Unit, number> = {
	mm: 1,
	cm: 10,
	m: 1000,
	in: 25.4,
	ft: 304.8
};

const UNIT_LABELS: Record<Unit, string> = {
	mm: 'mm',
	cm: 'cm',
	m: 'm',
	in: 'in',
	ft: 'ft'
};

export const DEFAULT_CONFIG: UnitConfig = {
	defaultUnit: 'mm',
	gridSpacing: 10
};

let currentConfig: UnitConfig = { ...DEFAULT_CONFIG };

export function setUnitConfig(config: Partial<UnitConfig>): void {
	currentConfig = { ...currentConfig, ...config };
}

export function getUnitConfig(): UnitConfig {
	return { ...currentConfig };
}

export function convertToMM(value: number, fromUnit: Unit): number {
	return value * UNIT_TO_MM[fromUnit];
}

export function convertFromMM(value: number, toUnit: Unit): number {
	return value / UNIT_TO_MM[toUnit];
}

export function convertBetweenUnits(value: number, fromUnit: Unit, toUnit: Unit): number {
	const mmValue = convertToMM(value, fromUnit);
	return convertFromMM(mmValue, toUnit);
}

export function parseValueWithUnit(
	input: number | string,
	defaultUnit?: Unit
): { value: number; unit: Unit; valueInMM: number } {
	const unit = defaultUnit || currentConfig.defaultUnit;

	if (typeof input === 'number') {
		return {
			value: input,
			unit,
			valueInMM: convertToMM(input, unit)
		};
	}

	const trimmed = input.trim();
	const match = trimmed.match(/^([-+]?[0-9]*\.?[0-9]+)\s*(mm|cm|m|in|ft)?$/i);

	if (!match) {
		throw new Error(`Invalid value format: ${input}`);
	}

	const value = parseFloat(match[1]);
	const parsedUnit = (match[2]?.toLowerCase() as Unit) || unit;

	return {
		value,
		unit: parsedUnit,
		valueInMM: convertToMM(value, parsedUnit)
	};
}

export function formatValue(valueInMM: number, unit: Unit, decimals: number = 2): string {
	const converted = convertFromMM(valueInMM, unit);
	return `${converted.toFixed(decimals)}${UNIT_LABELS[unit]}`;
}

export function getGridSpacingInMM(): number {
	return convertToMM(currentConfig.gridSpacing, currentConfig.defaultUnit);
}

export const unitSystem = {
	setConfig: setUnitConfig,
	getConfig: getUnitConfig,
	convertToMM,
	convertFromMM,
	convertBetweenUnits,
	parseValueWithUnit,
	formatValue,
	getGridSpacingInMM
};
