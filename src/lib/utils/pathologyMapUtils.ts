import { computeDistanceMeters } from '@/lib/geoUtils';

export interface PathologyMarkerItem {
  id: string;
  latitude: number;
  longitude: number;
  estaca?: string | null;
  imageUrl?: string | null;
  tipo?: string;
  grauSeveridade?: string | null;
  extensaoM?: number | null;
  larguraM?: number | null;
  dataCaptura?: Date | string;
  vistoriaId?: string;
  vistoriaData?: Date | string;
  trechoNome?: string;
  patologia: {
    id: string;
    codigoDnit: string;
    classificacaoEspecifica: string;
    mapeamentoIgg?: string;
    fatorPonderacao?: number;
  };
}

export interface PathologyGroup {
  lat: number;
  lng: number;
  estaca?: string | null;
  trechoNome?: string;
  items: PathologyMarkerItem[];
  codigos: string[];
}

/**
 * Retorna esquema de cores baseado no código DNIT da patologia
 */
export function getCodigoColor(codigo: string): { bg: string; text: string } {
  const c = (codigo || '').toUpperCase().trim();

  // Críticos / Alta Gravidade (Panelas, Afundamentos Plásticos, Trincas Jacaré Severas, Escorregamento, Ondulação)
  if (['P', 'ALP', 'ATP', 'FC-3', 'E', 'O', 'TB', 'J'].some((crit) => c.startsWith(crit))) {
    return { bg: '#dc2626', text: '#ffffff' }; // Vermelho
  }

  // Média Gravidade (Trincas Isoladas, Trincas Jacaré Moderadas, Afundamento de Trilha, Desgaste)
  if (['FC-2', 'TIL', 'TIC', 'TLC', 'TTC', 'ALC', 'ATC', 'D'].some((med) => c.startsWith(med))) {
    return { bg: '#d97706', text: '#ffffff' }; // Âmbar / Laranja
  }

  // Baixa Gravidade / Superficial (Trincas Iniciais, Exsudação, Remendos, Fissuras)
  if (['FC-1', 'EX', 'R', 'F', 'LC', 'PU'].some((low) => c.startsWith(low))) {
    return { bg: '#0284c7', text: '#ffffff' }; // Azul celeste
  }

  // Padrão / Outros
  return { bg: '#475569', text: '#ffffff' }; // Slate
}

/**
 * Agrupa patologias que compartilham a mesma localização (mesmas coordenadas ou raio <= maxDistanceMeters)
 */
export function groupPathologies(
  items: PathologyMarkerItem[],
  maxDistanceMeters: number = 10
): PathologyGroup[] {
  const groups: PathologyGroup[] = [];

  for (const item of items) {
    if (!item.latitude || !item.longitude || !item.patologia?.codigoDnit) continue;

    let matchedGroup = groups.find((g) => {
      // 1. Coordenadas idênticas
      if (Math.abs(g.lat - item.latitude) < 0.00002 && Math.abs(g.lng - item.longitude) < 0.00002) {
        return true;
      }
      // 2. Mesma estaca e proximidade geográfica (< 25m)
      if (item.estaca && g.estaca && item.estaca.trim().toLowerCase() === g.estaca.trim().toLowerCase()) {
        const d = computeDistanceMeters({ lat: g.lat, lng: g.lng }, { lat: item.latitude, lng: item.longitude });
        return d <= 25;
      }
      // 3. Proximidade geodésica estrita
      const d = computeDistanceMeters({ lat: g.lat, lng: g.lng }, { lat: item.latitude, lng: item.longitude });
      return d <= maxDistanceMeters;
    });

    if (matchedGroup) {
      matchedGroup.items.push(item);
      if (!matchedGroup.codigos.includes(item.patologia.codigoDnit)) {
        matchedGroup.codigos.push(item.patologia.codigoDnit);
      }
      if (!matchedGroup.estaca && item.estaca) {
        matchedGroup.estaca = item.estaca;
      }
      if (!matchedGroup.trechoNome && item.trechoNome) {
        matchedGroup.trechoNome = item.trechoNome;
      }
    } else {
      groups.push({
        lat: item.latitude,
        lng: item.longitude,
        estaca: item.estaca,
        trechoNome: item.trechoNome,
        items: [item],
        codigos: [item.patologia.codigoDnit],
      });
    }
  }

  return groups;
}

/**
 * Gera o HTML customizado para o DivIcon do balão de patologia no Leaflet
 */
export function generateBalloonHtml(group: PathologyGroup): string {
  // Contabiliza ocorrências por código
  const codeCounts: Record<string, number> = {};
  group.items.forEach((item) => {
    const cod = item.patologia.codigoDnit;
    codeCounts[cod] = (codeCounts[cod] || 0) + 1;
  });

  const uniqueCodes = Object.keys(codeCounts);
  const maxVisibleBadges = 3;
  const visibleCodes = uniqueCodes.slice(0, maxVisibleBadges);
  const remainingCount = uniqueCodes.length - maxVisibleBadges;

  const badgesHtml = visibleCodes
    .map((code) => {
      const count = codeCounts[code];
      const color = getCodigoColor(code);
      const label = count > 1 ? `${code}×${count}` : code;
      return `<span style="background:${color.bg}; color:${color.text}; font-size:10px; font-weight:800; padding:2px 5px; border-radius:4px; letter-spacing:-0.2px; display:inline-block; line-height:1.2;">${label}</span>`;
    })
    .join('');

  const overflowBadge =
    remainingCount > 0
      ? `<span style="background:#475569; color:#f8fafc; font-size:9px; font-weight:700; padding:2px 4px; border-radius:4px; line-height:1.2;">+${remainingCount}</span>`
      : '';

  return `
    <div class="custom-pathology-balloon" style="position:relative; display:inline-flex; flex-direction:column; align-items:center; transform:translate(-50%, -100%); cursor:pointer; user-select:none; filter:drop-shadow(0 3px 6px rgba(0,0,0,0.35)); transition:transform 0.15s ease;">
      <!-- Balão com códigos -->
      <div style="display:inline-flex; align-items:center; gap:3px; background:#0f172a; padding:3px 5px; border-radius:6px; border:1px solid #334155; white-space:nowrap;">
        ${badgesHtml}
        ${overflowBadge}
      </div>
      <!-- Seta do balão -->
      <div style="width:0; height:0; border-left:4px solid transparent; border-right:4px solid transparent; border-top:5px solid #0f172a; margin-top:-1px;"></div>
      <!-- Ponto de contato no eixo da pista -->
      <div style="width:6px; height:6px; background:#ef4444; border:1.5px solid #ffffff; border-radius:50%; margin-top:-1px; box-shadow:0 1px 3px rgba(0,0,0,0.5);"></div>
    </div>
  `;
}

/**
 * Gera o HTML rico para o Popup do Leaflet com a lista completa de defeitos do ponto
 */
export function generatePopupHtml(group: PathologyGroup): string {
  const dataVistoria = group.items[0]?.vistoriaData || group.items[0]?.dataCaptura;
  let dataStr = '';
  if (dataVistoria) {
    try {
      dataStr = new Date(dataVistoria).toLocaleDateString('pt-BR');
    } catch {
      dataStr = '';
    }
  }

  const isHighDensity = group.items.length >= 10;
  const isModerateDensity = group.items.length >= 5 && group.items.length < 10;

  const countBadgeHtml = isHighDensity
    ? `<span style="background:#fee2e2; color:#b91c1c; border:1px solid #fca5a5; font-size:10px; font-weight:800; padding:2px 7px; border-radius:9999px;">⚠️ ${group.items.length} defeitos</span>`
    : isModerateDensity
    ? `<span style="background:#fef3c7; color:#b45309; border:1px solid #fcd34d; font-size:10px; font-weight:700; padding:2px 7px; border-radius:9999px;">${group.items.length} defeitos</span>`
    : `<span style="background:#f1f5f9; color:#334155; border:1px solid #cbd5e1; font-size:10px; font-weight:700; padding:2px 7px; border-radius:9999px;">${group.items.length} ${group.items.length === 1 ? 'defeito' : 'defeitos'}</span>`;

  const itemsListHtml = group.items
    .map((item, index) => {
      const color = getCodigoColor(item.patologia.codigoDnit);
      const severidadeBadge = item.grauSeveridade
        ? `<span style="font-size:9.5px; color:#475569; background:#ffffff; padding:1px 5px; border-radius:3px; border:1px solid #e2e8f0;">Severidade: <strong>${item.grauSeveridade}</strong></span>`
        : '';
      const dimensoes =
        item.extensaoM || item.larguraM
          ? `<span style="font-size:9.5px; color:#64748b;">${item.extensaoM ? `Ext: <strong>${item.extensaoM}m</strong>` : ''} ${item.larguraM ? `| Larg: <strong>${item.larguraM}m</strong>` : ''}</span>`
          : '';

      const fotoThumb = item.imageUrl
        ? `
          <a href="${item.imageUrl}" target="_blank" rel="noopener noreferrer" title="Clique para ver a foto original" style="flex-shrink:0; display:block;">
            <img src="${item.imageUrl}" alt="${item.patologia.codigoDnit}" style="width:46px; height:46px; object-fit:cover; border-radius:5px; border:1px solid #cbd5e1; box-shadow:0 1px 2px rgba(0,0,0,0.08);" />
          </a>
        `
        : '';

      return `
        <div style="display:flex; gap:8px; align-items:flex-start; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:6px; transition:background 0.15s ease;">
          ${fotoThumb}
          <div style="flex:1; min-width:0;">
            <div style="display:flex; align-items:center; gap:5px; flex-wrap:wrap;">
              <span style="background:${color.bg}; color:${color.text}; font-size:10px; font-weight:800; padding:1px 5px; border-radius:4px; line-height:1.2;">
                ${item.patologia.codigoDnit}
              </span>
              <span style="font-weight:600; font-size:11px; color:#1e293b; line-height:1.2;">
                ${item.patologia.classificacaoEspecifica}
              </span>
            </div>
            <div style="margin-top:3px; display:flex; align-items:center; gap:4px; flex-wrap:wrap;">
              ${severidadeBadge}
              ${dimensoes}
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  return `
    <div style="font-family:ui-sans-serif, system-ui, -apple-system, sans-serif; font-size:12px; color:#0f172a; max-width:320px; min-width:260px; padding:2px;">
      <!-- Cabeçalho -->
      <div style="border-bottom:1px solid #e2e8f0; padding-bottom:6px; margin-bottom:8px;">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:4px;">
          <span style="font-weight:700; font-size:13px; color:#0f172a;">
            ${group.trechoNome ? `${group.trechoNome}` : 'Patologias Identificadas'}
          </span>
          ${countBadgeHtml}
        </div>
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:4px; margin-top:3px;">
          ${group.estaca ? `<span style="font-size:11px; color:#475569; font-weight:600;">📍 Estaca: ${group.estaca}</span>` : ''}
          <span style="background:#ecfdf5; color:#047857; font-size:9.5px; font-weight:700; padding:1px 5px; border-radius:3px; border:1px solid #a7f3d0;">
            ✓ RFT Aprovado
          </span>
        </div>
        ${dataStr ? `<div style="font-size:10px; color:#64748b; margin-top:2px;">📅 Vistoria Homologada: ${dataStr}</div>` : ''}
      </div>

      <!-- Lista de Patologias no Ponto com Rolagem Suave -->
      <div style="display:flex; flex-direction:column; gap:6px; max-height:300px; overflow-y:auto; padding-right:3px; scrollbar-width:thin; scrollbar-color:#cbd5e1 transparent;">
        ${itemsListHtml}
      </div>
      ${group.items.length > 5 ? `<div style="text-align:center; font-size:9.5px; color:#94a3b8; margin-top:6px;">Role para ver todas as ${group.items.length} patologias deste ponto</div>` : ''}
    </div>
  `;
}
