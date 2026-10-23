import React, { useMemo } from 'react';
import { View, Image, StyleProp, ViewStyle, ImageStyle } from 'react-native';
import { SvgXml, SvgUri } from 'react-native-svg';

interface StickerViewProps {
  uri: string;
  size?: number;
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle | ImageStyle>;
  resizeMode?: 'contain' | 'cover';
  baseUrl?: string;
}

const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

function decodeBase64Safe(input: string): string {
  if (typeof atob === 'function') {
    try {
      return atob(input);
    } catch {}
  }
  try {
    const str = input.replace(/[\r\n\t ]/g, '').replace(/=+$/, '');
    let output = '';
    let bc = 0;
    let bs = 0;
    for (let idx = 0; idx < str.length; idx++) {
      const charIndex = B64_CHARS.indexOf(str.charAt(idx));
      if (charIndex >= 0) {
        bs = bc % 4 ? bs * 64 + charIndex : charIndex;
        if (bc++ % 4) {
          output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
        }
      }
    }
    return output;
  } catch {
    return '';
  }
}

export const StickerView: React.FC<StickerViewProps> = ({
  uri,
  size = 120,
  width,
  height,
  style,
  resizeMode = 'contain',
  baseUrl,
}) => {
  const w = width ?? size;
  const h = height ?? size;

  const resolvedUri = useMemo(() => {
    if (!uri || typeof uri !== 'string') return '';
    const trimmed = uri.trim();
    if (trimmed.startsWith('/') && baseUrl) {
      return `${baseUrl.replace(/\/+$/, '')}${trimmed}`;
    }
    return trimmed;
  }, [uri, baseUrl]);

  const { svgXml, isRemoteSvg } = useMemo(() => {
    if (!resolvedUri) return { svgXml: null, isRemoteSvg: false };

    // 1. Raw SVG string
    if (resolvedUri.startsWith('<svg') || resolvedUri.startsWith('<?xml')) {
      return { svgXml: resolvedUri, isRemoteSvg: false };
    }

    // 2. Data URI for SVG
    const svgDataMatch = resolvedUri.match(/^data:image\/svg\+xml[^,]*,/i);
    if (svgDataMatch) {
      const header = svgDataMatch[0];
      const payload = resolvedUri.slice(header.length);

      if (header.toLowerCase().includes(';base64')) {
        const decoded = decodeBase64Safe(payload);
        if (decoded && (decoded.includes('<svg') || decoded.includes('<SVG'))) {
          return { svgXml: decoded, isRemoteSvg: false };
        }
      } else {
        try {
          const decoded = decodeURIComponent(payload);
          return { svgXml: decoded, isRemoteSvg: false };
        } catch {
          if (payload.includes('<svg') || payload.includes('%3Csvg') || payload.includes('%3CSVG')) {
            try {
              const unescaped = unescape(payload);
              return { svgXml: unescaped, isRemoteSvg: false };
            } catch {
              return { svgXml: payload, isRemoteSvg: false };
            }
          }
        }
      }
    }

    // 3. Remote SVG URL (e.g. https://.../sticker.svg)
    const cleanUrl = resolvedUri.split('?')[0].toLowerCase();
    if (cleanUrl.endsWith('.svg') || resolvedUri.includes('.svg?')) {
      return { svgXml: null, isRemoteSvg: true };
    }

    return { svgXml: null, isRemoteSvg: false };
  }, [resolvedUri]);

  if (svgXml) {
    return (
      <View style={[{ width: w, height: h, alignItems: 'center', justifyContent: 'center' }, style]}>
        <SvgXml xml={svgXml} width={w} height={h} />
      </View>
    );
  }

  if (isRemoteSvg) {
    return (
      <View style={[{ width: w, height: h, alignItems: 'center', justifyContent: 'center' }, style]}>
        <SvgUri uri={resolvedUri} width={w} height={h} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: resolvedUri }}
      style={[{ width: w, height: h }, style as ImageStyle]}
      resizeMode={resizeMode}
    />
  );
};

export default StickerView;
