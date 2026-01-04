import svgSerializer from '@jscad/svg-serializer';

export function serializeToSvg(geometry: unknown): string {
	if (!geometry) return '';

	try {
		const rawData = svgSerializer.serialize({ unit: 'mm' }, geometry);
		return rawData.join('');
	} catch (error) {
		console.error('Error serializing to SVG:', error);
		return '<svg><text x="10" y="20" fill="red">Error rendering geometry</text></svg>';
	}
}
