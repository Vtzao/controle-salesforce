function getMatrixSectionMarkup(title, description, options = {}) {
    const filteredUsers = Array.isArray(options.filteredUsers) ? options.filteredUsers : getFilteredUsers();
    const matrixCategories = Array.isArray(options.matrixCategories) ? options.matrixCategories : state.categories;
    const hasModules = matrixCategories.some((category) => category.modules.length);
    const readOnly = Boolean(options.readOnly);
    const showExportButton = options.showExportButton !== false;
    const scrollKey = options.scrollKey || 'report-matrix';
    const desktopMatrixScrollerClass = String(options.desktopMatrixScrollerClass || '').trim();
    const statusBlocked = isPending('saveStatus') || isPending('loadData');
    const hasDraft = !readOnly && hasPendingStatusChanges();
    const draftCount = hasDraft ? Object.keys(state.statusDraft).length : 0;
    const selectedCount = !readOnly ? selectedStatusCellCount() : 0;
    const selectionModeActive = !readOnly && Boolean(state.statusSelectionMode);
    const statusOptions = [MODULE_STATUS.COMPLETED, MODULE_STATUS.NOT_COMPLETED, MODULE_STATUS.SCHEDULED, MODULE_STATUS.NOT_PARTICIPATING];

    return `
        <div class="space-y-6">
            <div class="flex justify-between items-end gap-4 flex-wrap">
                <div>
                    <h2 class="text-2xl font-bold text-slate-100">${escapeHtml(title)}</h2>
                    <p class="text-sm text-slate-300">${escapeHtml(description)}</p>
                </div>
                <div class="flex items-center gap-2">
                    ${readOnly ? `
                        <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-600 border border-slate-200">
                            Modo somente leitura
                        </span>
                    ` : ''}
                    ${showExportButton ? `
                        <button onclick="exportCsv()" class="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50">
                            <i data-lucide="file-spreadsheet" class="w-4 h-4"></i> Exportar CSV
                        </button>
                    ` : ''}
                </div>
            </div>
            <div class="flex flex-wrap items-center gap-2">
                ${statusOptions.map((status) => {
                    const visual = getModuleStatusVisual(status);
                    return `
                        <span class="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-600">
                            <span class="w-5 h-5 inline-flex items-center justify-center rounded-full border ${visual.dotClass}">
                                <i data-lucide="${visual.icon}" class="w-3 h-3 ${visual.dotIconClass}"></i>
                            </span>
                            ${escapeHtml(visual.label)}
                        </span>
                    `;
                }).join('')}
            </div>
            ${!readOnly ? `
                <div class="p-3 sm:p-4 bg-slate-50/95 border border-slate-200 rounded-2xl space-y-2.5 sm:space-y-3 backdrop-blur-sm ${
                    selectionModeActive
                        ? 'sticky top-[66px] sm:top-[76px] z-30 shadow-lg'
                        : ''
                }">
                    <div class="flex items-start sm:items-center justify-between gap-2.5 flex-wrap">
                        <p class="text-xs sm:text-sm font-semibold text-slate-800">
                            ${selectionModeActive
                                ? selectedCount && hasDraft
                                    ? `${formatCountLabel(selectedCount, 'módulo selecionado', 'módulos selecionados')} e ${formatCountLabel(draftCount, 'alteração pendente', 'alterações pendentes')}.`
                                    : selectedCount
                                        ? `${formatCountLabel(selectedCount, 'módulo selecionado', 'módulos selecionados')}.`
                                        : hasDraft
                                            ? `${formatCountLabel(draftCount, 'alteração pendente', 'alterações pendentes')}. Continue selecionando módulos ou salve as alterações.`
                                            : 'Modo seleção ativo. Clique nos módulos da matriz para selecionar.'
                                : hasDraft
                                    ? `${formatCountLabel(draftCount, 'alteração pendente', 'alterações pendentes')}. Clique em Selecionar para continuar editando.`
                                    : 'Clique em Selecionar para marcar os módulos que deseja alterar.'}
                        </p>
                        <div class="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                            ${selectionModeActive ? `
                                <button id="status-save-btn" onclick="saveStatusChanges()" ${statusBlocked || !hasDraft ? 'disabled' : ''} class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-amber-600 text-white text-xs sm:text-sm font-bold hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed">
                                    Salvar Alterações
                                </button>
                                <button onclick="clearStatusSelection(); render();" ${statusBlocked || !selectedCount ? 'disabled' : ''} class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-white border border-slate-300 text-slate-700 text-xs sm:text-sm font-bold hover:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed">
                                    Limpar seleção
                                </button>
                                <button onclick="cancelStatusChanges()" ${statusBlocked ? 'disabled' : ''} class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-white border border-amber-300 text-amber-800 text-xs sm:text-sm font-bold hover:bg-amber-50 disabled:opacity-60 disabled:cursor-not-allowed">
                                    Cancelar Alteração
                                </button>
                            ` : `
                                <button onclick="toggleStatusSelectionMode()" ${statusBlocked ? 'disabled' : ''} class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-white border border-slate-300 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed">
                                    Selecionar
                                </button>
                            `}
                        </div>
                    </div>
                    ${selectionModeActive ? `
                        <div class="space-y-1.5 sm:space-y-2 text-center">
                            <p class="text-[11px] sm:text-xs font-semibold text-slate-500">
                                Selecione para qual status deseja alterar.
                            </p>
                            <div class="flex items-center justify-start sm:justify-center gap-1.5 sm:gap-2 overflow-x-auto pb-1">
                                ${statusOptions.map((status) => {
                                    const visual = getModuleStatusVisual(status);
                                    const active = normalizeModuleStatus(state.bulkStatusTarget) === status;
                                    return `
                                        <button
                                            onclick="setStatusForSelectedCells('${escapeAttr(status)}')"
                                            ${statusBlocked || !selectedCount ? 'disabled' : ''}
                                            class="shrink-0 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold border inline-flex items-center gap-1 sm:gap-1.5 ${active ? 'bg-white border-slate-400 text-slate-900 shadow-sm ring-1 ring-slate-300' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'} disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            <span class="w-4 h-4 sm:w-5 sm:h-5 inline-flex items-center justify-center rounded-full border ${visual.dotClass}">
                                                <i data-lucide="${visual.icon}" class="w-2.5 h-2.5 sm:w-3 sm:h-3 ${visual.dotIconClass}"></i>
                                            </span>
                                            ${escapeHtml(visual.label)}
                                        </button>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            <div class="bg-white rounded-3xl shadow-lg overflow-hidden border border-slate-100">
                ${hasModules ? `
                    <div class="lg:hidden p-3 sm:p-4 space-y-3 bg-slate-50/60">
                        ${(() => {
                            const MOBILE_PAGE_SIZE = 15;
                            const currentPage = Math.max(0, state.mobileMatrixPages[scrollKey] || 0);
                            const totalPages = Math.ceil(filteredUsers.length / MOBILE_PAGE_SIZE);
                            const safePage = currentPage >= totalPages ? 0 : currentPage;
                            const pagedUsers = filteredUsers.slice(safePage * MOBILE_PAGE_SIZE, (safePage + 1) * MOBILE_PAGE_SIZE);
                            const paginationMarkup = totalPages > 1 ? `
                                <div class="flex items-center justify-between gap-3 pt-1">
                                    <button
                                        onclick="setMobileMatrixPage('${escapeAttr(scrollKey)}', ${safePage - 1})"
                                        ${safePage === 0 ? 'disabled' : ''}
                                        class="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >← Anterior</button>
                                    <span class="text-xs font-semibold text-slate-500">${safePage + 1} / ${totalPages}</span>
                                    <button
                                        onclick="setMobileMatrixPage('${escapeAttr(scrollKey)}', ${safePage + 1})"
                                        ${safePage >= totalPages - 1 ? 'disabled' : ''}
                                        class="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >Próxima →</button>
                                </div>
                            ` : '';
                            return pagedUsers.length ? pagedUsers.map((user) => `
                            <article class="rounded-2xl border border-slate-200 bg-white p-3 space-y-3">
                                <div class="flex items-center gap-3 min-w-0">
                                    <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-[10px] uppercase shrink-0">
                                        ${escapeHtml(`${user.firstName[0] || ''}${user.lastName[0] || ''}`)}
                                    </div>
                                    <div class="min-w-0">
                                        <p class="font-bold text-xs text-slate-800 truncate" title="${escapeAttr(user.fullName)}">${escapeHtml(user.fullName)}</p>
                                        <p class="text-[10px] text-slate-400 font-bold uppercase">${escapeHtml(user.role)}</p>
                                    </div>
                                </div>
                                <div class="space-y-2">
                                    ${matrixCategories.map((category) => category.modules.length ? `
                                        <section class="rounded-xl border border-slate-200 overflow-hidden">
                                            <div class="px-2.5 py-2 bg-slate-100 flex items-center justify-between gap-2">
                                                <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-600 truncate">${escapeHtml(category.name)}</p>
                                                <span class="text-[9px] font-bold uppercase tracking-wide ${user.categoryIds.includes(category.id) ? 'text-emerald-600' : 'text-slate-500'}">
                                                    ${user.categoryIds.includes(category.id) ? 'Inscrito' : 'Não inscrito'}
                                                </span>
                                            </div>
                                            <div class="p-2 space-y-1.5">
                                                ${category.modules.map((module) => {
                                                    const assigned = user.categoryIds.includes(category.id);
                                                    const status = assigned
                                                        ? getModuleStatus(user, category.id, module.id)
                                                        : MODULE_STATUS.NOT_PARTICIPATING;
                                                    const selected = assigned && !readOnly && isStatusCellSelected(user.id, category.id, module.id);
                                                    const statusVisual = getModuleStatusVisual(status);
                                                    const statusLabel = getModuleStatusLabel(status);
                                                    const statusIcon = `
                                                        <span class="w-8 h-8 inline-flex items-center justify-center rounded-full border ${statusVisual.dotClass}">
                                                            <i data-lucide="${statusVisual.icon}" class="w-3.5 h-3.5 ${statusVisual.dotIconClass}"></i>
                                                        </span>
                                                    `;
                                                    const buttonTitle = !selectionModeActive
                                                        ? `${statusLabel}. Clique em Selecionar para marcar este módulo.`
                                                        : selected
                                                            ? `${statusLabel}. Clique para remover da seleção.`
                                                            : `${statusLabel}. Clique para selecionar este módulo.`;

                                                    return `
                                                        <div class="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 ${selected ? 'bg-blue-50 ring-1 ring-blue-200' : 'bg-white'}">
                                                            <span class="text-[11px] font-semibold text-slate-700 truncate">${escapeHtml(module.name)}</span>
                                                            ${assigned && !readOnly ? `
                                                                <button
                                                                    data-status-user-id="${escapeAttr(user.id)}"
                                                                    data-status-category-id="${escapeAttr(category.id)}"
                                                                    data-status-module-id="${escapeAttr(module.id)}"
                                                                    onpointerdown="startStatusSelectionDrag(event, '${user.id}', '${category.id}', '${module.id}')"
                                                                    onclick="toggleCompletion('${user.id}', '${category.id}', '${module.id}')"
                                                                    ${statusBlocked || !selectionModeActive ? 'disabled' : ''}
                                                                    title="${escapeAttr(buttonTitle)}"
                                                                    aria-label="${escapeAttr(`${user.fullName} — ${module.name}: ${statusLabel}`)}"
                                                                    class="status-selectable-cell-button touch-none w-9 h-9 inline-flex items-center justify-center rounded-full transition-all transform active:scale-95 ${selected ? 'ring-2 ring-blue-500 bg-blue-50 shadow-sm' : (selectionModeActive ? 'hover:bg-slate-100' : '')} disabled:opacity-60 disabled:cursor-not-allowed"
                                                                >
                                                                    ${statusIcon}
                                                                </button>
                                                            ` : `
                                                                <div class="w-9 h-9 inline-flex items-center justify-center rounded-full" title="${escapeAttr(statusLabel)}" aria-label="${escapeAttr(`${user.fullName} — ${module.name}: ${statusLabel}`)}">${statusIcon}</div>
                                                            `}
                                                        </div>
                                                    `;
                                                }).join('')}
                                            </div>
                                        </section>
                                    ` : '').join('')}
                                </div>
                            </article>
                        `).join('') + paginationMarkup : `
                                <div class="p-5 text-center text-slate-400 bg-white rounded-2xl border border-slate-100">
                                    Nenhum usuário encontrado para o filtro atual.
                                </div>
                            `;
                        })()}
                    </div>
                    <div class="hidden lg:block fixed-scroll-target matrix-scroll w-full max-w-full overflow-x-auto" data-scroll-key="${escapeAttr(scrollKey)}">
                        ${desktopMatrixScrollerClass ? `<div class="users-table-scroll ${desktopMatrixScrollerClass}">` : ''}
                        <table class="w-full min-w-max text-left border-collapse matrix-table">
                            <thead>
                                <tr class="bg-slate-800 text-white">
                                    <th class="px-3 sm:px-4 py-3 text-[10px] font-black uppercase tracking-widest sticky-col z-20 bg-slate-800 min-w-[180px] sm:min-w-[220px]">Usuário</th>
                                    ${matrixCategories.map((category) => `
                                        <th colspan="${Math.max(category.modules.length, 1)}" class="px-2.5 py-2.5 text-[10px] font-black uppercase tracking-widest text-center border-l border-slate-700 bg-slate-700/50">
                                            ${escapeHtml(category.name)}
                                        </th>
                                    `).join('')}
                                </tr>
                                <tr class="bg-slate-50">
                                    <th class="px-3 sm:px-4 py-3 text-[11px] font-bold text-slate-500 uppercase sticky-col z-10 bg-slate-50 min-w-[180px] sm:min-w-[220px]">Dados</th>
                                    ${matrixCategories.map((category) => category.modules.length
                                        ? category.modules.map((module) => `
                                            <th class="px-2 py-2.5 text-[9px] font-bold text-slate-400 uppercase text-center min-w-[96px]">
                                                ${escapeHtml(module.name)}
                                            </th>
                                        `).join('')
                                        : '<th class="px-2 py-2.5 text-[9px] font-bold text-slate-300 uppercase text-center min-w-[96px]">Sem módulos</th>'
                                    ).join('')}
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                ${filteredUsers.length ? filteredUsers.map((user) => `
                                    <tr class="hover:bg-indigo-50 group">
                                        <td class="px-3 sm:px-4 py-2.5 sticky-col z-20 group-hover:bg-indigo-50 min-w-[180px] sm:min-w-[220px]">
                                            <div class="flex items-center gap-2 min-w-0">
                                                <div class="w-7 h-7 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-[9px] uppercase">
                                                    ${escapeHtml(`${user.firstName[0] || ''}${user.lastName[0] || ''}`)}
                                                </div>
                                                <div class="min-w-0">
                                                    <p class="font-bold text-[11px] truncate" title="${escapeAttr(user.fullName)}">${escapeHtml(user.fullName)}</p>
                                                    <p class="text-[9px] text-slate-400 font-bold uppercase">${escapeHtml(user.role)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        ${matrixCategories.map((category) => category.modules.length
                                            ? category.modules.map((module) => {
                                                const assigned = user.categoryIds.includes(category.id);
                                                const status = assigned
                                                    ? getModuleStatus(user, category.id, module.id)
                                                    : MODULE_STATUS.NOT_PARTICIPATING;
                                                const selected = assigned && !readOnly && isStatusCellSelected(user.id, category.id, module.id);
                                                const statusVisual = getModuleStatusVisual(status);
                                                const statusLabel = getModuleStatusLabel(status);
                                                const statusIcon = `
                                                    <span class="w-7 h-7 inline-flex items-center justify-center rounded-full border ${statusVisual.dotClass}">
                                                        <i data-lucide="${statusVisual.icon}" class="w-3 h-3 ${statusVisual.dotIconClass}"></i>
                                                    </span>
                                                `;
                                                const buttonTitle = !selectionModeActive
                                                    ? `${statusLabel}. Clique em Selecionar para marcar este módulo.`
                                                    : selected
                                                        ? `${statusLabel}. Clique para remover da seleção.`
                                                        : `${statusLabel}. Clique para selecionar este módulo.`;
                                                return `
                                                    <td class="${assigned ? 'px-1.5 py-2 text-center' : 'px-1.5 py-2 text-center bg-slate-50/50'}">
                                                        ${assigned && !readOnly ? `
                                                            <button
                                                                data-status-user-id="${escapeAttr(user.id)}"
                                                                data-status-category-id="${escapeAttr(category.id)}"
                                                                data-status-module-id="${escapeAttr(module.id)}"
                                                                onpointerdown="startStatusSelectionDrag(event, '${user.id}', '${category.id}', '${module.id}')"
                                                                onclick="toggleCompletion('${user.id}', '${category.id}', '${module.id}')"
                                                                ${statusBlocked || !selectionModeActive ? 'disabled' : ''}
                                                                title="${escapeAttr(buttonTitle)}"
                                                                aria-label="${escapeAttr(`${user.fullName} — ${module.name}: ${statusLabel}`)}"
                                                                class="status-selectable-cell-button touch-none w-8 h-8 inline-flex items-center justify-center rounded-full transition-all transform active:scale-95 ${selected ? 'ring-2 ring-blue-500 bg-blue-50 shadow-sm' : (selectionModeActive ? 'hover:bg-slate-100' : '')} disabled:opacity-60 disabled:cursor-not-allowed"
                                                            >
                                                                ${statusIcon}
                                                            </button>
                                                        ` : `
                                                            <div class="w-8 h-8 inline-flex items-center justify-center rounded-full mx-auto" title="${escapeAttr(statusLabel)}" aria-label="${escapeAttr(`${user.fullName} — ${module.name}: ${statusLabel}`)}">${statusIcon}</div>
                                                        `}
                                                    </td>
                                                `;
                                            }).join('')
                                            : '<td class="bg-slate-50/50"></td>'
                                        ).join('')}
                                    </tr>
                                `).join('') : `
                                    <tr>
                                        <td colspan="${matrixCategories.reduce((sum, category) => sum + Math.max(category.modules.length, 1), 0) + 1}" class="px-6 py-12 text-center text-slate-400">
                                            Nenhum usuário encontrado para o filtro atual.
                                        </td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                        ${desktopMatrixScrollerClass ? '</div>' : ''}
                    </div>
                ` : `
                    <div class="p-10 text-center text-slate-500">
                        Cadastre ao menos um módulo para exibir a matriz.
                    </div>
                `}
            </div>
        </div>
    `;
}

function polarToCartesian(cx, cy, radius, angleInDegrees) {
    const radians = ((angleInDegrees - 90) * Math.PI) / 180;
    return {
        x: cx + (radius * Math.cos(radians)),
        y: cy + (radius * Math.sin(radians)),
    };
}

function describePieSlice(cx, cy, radius, startAngle, endAngle) {
    const start = polarToCartesian(cx, cy, radius, endAngle);
    const end = polarToCartesian(cx, cy, radius, startAngle);
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    return [
        `M ${cx} ${cy}`,
        `L ${start.x.toFixed(3)} ${start.y.toFixed(3)}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x.toFixed(3)} ${end.y.toFixed(3)}`,
        'Z',
    ].join(' ');
}

function getTextColorForSlice(hexColor) {
    const value = String(hexColor || '').trim();
    if (!/^#?[0-9a-f]{6}$/i.test(value)) {
        return '#ffffff';
    }
    const raw = value.startsWith('#') ? value.slice(1) : value;
    const r = parseInt(raw.slice(0, 2), 16);
    const g = parseInt(raw.slice(2, 4), 16);
    const b = parseInt(raw.slice(4, 6), 16);
    const luminance = ((0.2126 * r) + (0.7152 * g) + (0.0722 * b)) / 255;
    return luminance > 0.62 ? '#0f172a' : '#ffffff';
}

function formatStatusPercentage(part, total, options = {}) {
    const safeTotal = Number(total) || 0;
    if (!safeTotal) {
        return '0%';
    }
    const fractionDigits = Number.isFinite(options.fractionDigits)
        ? Math.max(0, Number(options.fractionDigits))
        : 1;
    const percentage = ((Number(part) || 0) / safeTotal) * 100;
    return `${percentage.toLocaleString('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: fractionDigits,
    })}%`;
}

function getStatusPieChartMarkup(items, total, options = {}) {
    const safeTotal = Number(total) || 0;
    const size = Number(options.size) || 224;
    const pieClass = String(options.pieClass || '');
    const chartId = String(options.chartId || `status-pie-${Math.random().toString(36).slice(2, 9)}`);
    const viewBoxSize = 100;
    const cx = 50;
    const cy = 50;
    const radius = 48;

    if (!safeTotal) {
        return `
            <div data-dashboard-pie class="${pieClass} mx-auto" style="width:${size}px; height:${size}px;">
                <svg viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" class="w-full h-full" role="img" aria-label="Sem dados para gráfico">
                    <circle cx="${cx}" cy="${cy}" r="${radius}" fill="#e2e8f0"></circle>
                </svg>
            </div>
        `;
    }

    let currentAngle = 0;
    const sliceMarkup = [];

    items.forEach((item, index) => {
        const count = Number(item.count) || 0;
        if (count <= 0) {
            return;
        }

        const sliceAngle = (count / safeTotal) * 360;
        const endAngle = currentAngle + sliceAngle;
        const path = describePieSlice(cx, cy, radius, currentAngle, endAngle);
        const percentage = (count / safeTotal) * 100;
        const midAngle = currentAngle + (sliceAngle / 2);
        const labelRadius = percentage < 8 ? radius * 0.78 : radius * 0.62;
        const labelPoint = polarToCartesian(cx, cy, labelRadius, midAngle);
        const textColor = getTextColorForSlice(item.color);
        const labelFontSize = percentage < 8 ? 5.5 : 6.5;
        const offsetDistance = 2.4;
        const offsetPoint = polarToCartesian(0, 0, offsetDistance, midAngle);
        const percentageLabel = formatStatusPercentage(count, safeTotal, { fractionDigits: 1 });

        sliceMarkup.push(`
            <g
                class="dashboard-pie-slice-group"
                data-pie-slice
                data-pie-chart-id="${escapeAttr(chartId)}"
                data-pie-index="${index}"
                data-pie-label="${escapeAttr(item.label)}"
                data-pie-count="${count}"
                data-pie-percentage="${percentage.toFixed(4)}"
                data-pie-color="${escapeAttr(item.color)}"
                data-pie-offset-x="${offsetPoint.x.toFixed(3)}"
                data-pie-offset-y="${offsetPoint.y.toFixed(3)}"
                tabindex="0"
                role="button"
                aria-label="${escapeAttr(`${item.label}: ${count} registros (${percentageLabel})`)}"
            >
                <path class="dashboard-pie-slice-path" d="${path}" fill="${item.color}" stroke="#f8fafc" stroke-width="1.4">
                    <title>${escapeHtml(item.label)}: ${count} (${percentageLabel})</title>
                </path>
                <text
                    class="dashboard-pie-slice-label"
                    x="${labelPoint.x.toFixed(3)}"
                    y="${labelPoint.y.toFixed(3)}"
                    text-anchor="middle"
                    dominant-baseline="middle"
                    font-size="${labelFontSize}"
                    font-weight="800"
                    fill="${textColor}"
                    paint-order="stroke"
                    stroke="rgba(15,23,42,0.28)"
                    stroke-width="0.8"
                    stroke-linejoin="round"
                >${count}</text>
            </g>
        `);

        currentAngle = endAngle;
    });

    return `
        <div
            data-dashboard-pie-chart
            data-pie-chart-id="${escapeAttr(chartId)}"
            data-pie-total="${safeTotal}"
            class="dashboard-pie-card"
        >
            <div data-dashboard-pie class="${pieClass} dashboard-pie-enter mx-auto" style="width:${size}px; height:${size}px;">
                <svg viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" class="w-full h-full" role="img" aria-label="Gráfico de status dos treinamentos">
                    ${sliceMarkup.join('')}
                </svg>
            </div>
            <div class="mt-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5">
                <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2 min-w-0">
                        <span data-pie-detail-dot class="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0"></span>
                        <p data-pie-detail-label class="text-xs font-bold text-slate-700 truncate">Passe o mouse ou clique em uma fatia</p>
                    </div>
                    <p data-pie-detail-percentage class="text-sm font-black text-slate-700 shrink-0">--</p>
                </div>
                <p data-pie-detail-count class="mt-1 text-[11px] text-slate-500 font-semibold">Total analisado: ${safeTotal} registro(s).</p>
            </div>
            <button
                type="button"
                data-pie-clear-selection
                class="mt-2 hidden text-[11px] font-bold text-slate-500 hover:text-slate-700"
            >
                Limpar seleção
            </button>
        </div>
    `;
}

function initializeDashboardPieInteractions() {
    const pieCharts = Array.from(document.querySelectorAll('[data-dashboard-pie-chart]'));
    pieCharts.forEach((chart) => {
        if (chart.dataset.pieBound === 'true') {
            return;
        }
        chart.dataset.pieBound = 'true';

        const slices = Array.from(chart.querySelectorAll('[data-pie-slice]'));
        if (!slices.length) {
            return;
        }

        const safeTotal = Number(chart.dataset.pieTotal) || 0;
        const detailDot = chart.querySelector('[data-pie-detail-dot]');
        const detailLabel = chart.querySelector('[data-pie-detail-label]');
        const detailPercentage = chart.querySelector('[data-pie-detail-percentage]');
        const detailCount = chart.querySelector('[data-pie-detail-count]');
        const clearSelectionButton = chart.querySelector('[data-pie-clear-selection]');

        let hoveredSlice = null;
        let pinnedSlice = null;

        const updateDetailPanel = (slice) => {
            if (!detailDot || !detailLabel || !detailPercentage || !detailCount) {
                return;
            }
            if (!slice) {
                detailDot.style.backgroundColor = '#cbd5e1';
                detailLabel.textContent = 'Passe o mouse ou clique em uma fatia';
                detailPercentage.textContent = '--';
                detailCount.textContent = `Total analisado: ${safeTotal} registro(s).`;
                return;
            }

            const label = String(slice.dataset.pieLabel || '').trim() || 'Status';
            const count = Number(slice.dataset.pieCount) || 0;
            const percentage = Number(slice.dataset.piePercentage) || 0;
            detailDot.style.backgroundColor = slice.dataset.pieColor || '#94a3b8';
            detailLabel.textContent = label;
            detailPercentage.textContent = formatStatusPercentage(percentage, 100, { fractionDigits: 1 });
            detailCount.textContent = `${count} registro(s) de ${safeTotal}.`;
        };

        const applyVisualState = (activeSlice) => {
            slices.forEach((slice) => {
                const isActive = slice === activeSlice;
                slice.classList.toggle('is-active', isActive);
                slice.classList.toggle('is-dimmed', Boolean(activeSlice) && !isActive);
                if (isActive) {
                    const offsetX = Number(slice.dataset.pieOffsetX) || 0;
                    const offsetY = Number(slice.dataset.pieOffsetY) || 0;
                    slice.setAttribute('transform', `translate(${offsetX.toFixed(3)} ${offsetY.toFixed(3)})`);
                } else {
                    slice.removeAttribute('transform');
                }
            });
            updateDetailPanel(activeSlice);
            if (clearSelectionButton) {
                clearSelectionButton.classList.toggle('hidden', !pinnedSlice);
            }
        };

        const refresh = () => {
            applyVisualState(hoveredSlice || pinnedSlice);
        };

        slices.forEach((slice) => {
            slice.addEventListener('mouseenter', () => {
                hoveredSlice = slice;
                refresh();
            });
            slice.addEventListener('mouseleave', () => {
                hoveredSlice = null;
                refresh();
            });
            slice.addEventListener('focus', () => {
                hoveredSlice = slice;
                refresh();
            });
            slice.addEventListener('blur', () => {
                hoveredSlice = null;
                refresh();
            });
            slice.addEventListener('click', (event) => {
                pinnedSlice = pinnedSlice === slice ? null : slice;
                hoveredSlice = null;
                refresh();
                if (event.detail > 0 && typeof slice.blur === 'function') {
                    slice.blur();
                }
            });
            slice.addEventListener('keydown', (event) => {
                if (event.key !== 'Enter' && event.key !== ' ') {
                    return;
                }
                event.preventDefault();
                pinnedSlice = pinnedSlice === slice ? null : slice;
                hoveredSlice = null;
                refresh();
            });
        });

        if (clearSelectionButton) {
            clearSelectionButton.addEventListener('click', () => {
                pinnedSlice = null;
                hoveredSlice = null;
                refresh();
            });
        }

        const pieSvg = chart.querySelector('[data-dashboard-pie] svg');
        if (pieSvg) {
            pieSvg.addEventListener('mouseleave', () => {
                hoveredSlice = null;
                refresh();
            });
        }

        refresh();
    });
}

function renderPublicOverview(container) {
    const filterState = getMatrixFilterState('public');
    const insights = getDashboardInsights();
    const distribution = getDashboardStatusDistribution(filterState);
    const selectedModulesCount = distribution.matrixCategories
        .reduce((sum, category) => sum + category.modules.length, 0);

    const filteredRoleCounts = new Map();
    for (const user of distribution.filteredUsers) {
        const role = String(user.role || '').trim() || 'Nao informado';
        filteredRoleCounts.set(role, (filteredRoleCounts.get(role) || 0) + 1);
    }
    const filteredRoleDistribution = [...filteredRoleCounts.entries()]
        .map(([role, count]) => ({ role, count }))
        .sort((a, b) => b.count - a.count || a.role.localeCompare(b.role, 'pt-BR', { sensitivity: 'base' }));
    const maxRoleCount = Math.max(...filteredRoleDistribution.map((item) => item.count), 1);

    const statusChartItems = [
        {
            status: MODULE_STATUS.COMPLETED,
            label: 'Concluído',
            color: '#10b981',
            count: distribution.counts[MODULE_STATUS.COMPLETED],
        },
        {
            status: MODULE_STATUS.NOT_COMPLETED,
            label: 'Não Concluído',
            color: '#f43f5e',
            count: distribution.counts[MODULE_STATUS.NOT_COMPLETED],
        },
        {
            status: MODULE_STATUS.SCHEDULED,
            label: 'Agendado',
            color: '#f59e0b',
            count: distribution.counts[MODULE_STATUS.SCHEDULED],
        },
        {
            status: MODULE_STATUS.NOT_PARTICIPATING,
            label: 'Não inscrito',
            color: '#475569',
            count: distribution.counts[MODULE_STATUS.NOT_PARTICIPATING],
        },
    ];

    const totalStatusRecords = distribution.totalRecords;
    const trackableRecords = totalStatusRecords - distribution.counts[MODULE_STATUS.NOT_PARTICIPATING];
    const completionRate = trackableRecords > 0
        ? Math.round((distribution.counts[MODULE_STATUS.COMPLETED] / trackableRecords) * 100)
        : 0;

    const publicPieMarkup = getStatusPieChartMarkup(statusChartItems, totalStatusRecords, {
        size: 232,
        chartId: 'public-overview-status-pie',
    });

    const matrixMarkup = getMatrixSectionMarkup(
        'Tabela Pública de Treinamentos',
        'Mesma visão de categorias, módulos e checks da administração, sem edição.',
        {
            readOnly: true,
            scrollKey: 'public-matrix',
            desktopMatrixScrollerClass: 'max-h-[74vh] overflow-y-auto overscroll-contain',
            filteredUsers: distribution.filteredUsers,
            matrixCategories: distribution.matrixCategories,
        }
    );

    container.innerHTML = `
        <div class="space-y-6 ${state.currentViewAnimationClass}">
            ${state.publicDataError ? `
                <div class="px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm font-semibold text-red-700">
                    ${escapeHtml(state.publicDataError)}
                </div>
            ` : ''}
            <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1.75fr)_minmax(320px,1fr)] gap-4 items-start">
                <section class="min-w-0">
                    ${matrixMarkup}
                </section>
                <aside class="space-y-4 xl:sticky xl:top-[88px]">
                    ${getMatrixFiltersMarkup('public')}
                    <div class="grid grid-cols-2 gap-3">
                        <div class="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                            <p class="text-[10px] uppercase tracking-[0.18em] font-black text-slate-400">Usuários totais</p>
                            <p data-dashboard-number="public-total-users" data-target="${insights.totalUsers}" class="mt-1 text-2xl font-black text-slate-800">${insights.totalUsers}</p>
                        </div>
                        <div class="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                            <p class="text-[10px] uppercase tracking-[0.18em] font-black text-slate-400">Usuários no filtro</p>
                            <p data-dashboard-number="public-filtered-users" data-target="${distribution.filteredUsers.length}" class="mt-1 text-2xl font-black text-slate-800">${distribution.filteredUsers.length}</p>
                        </div>
                        <div class="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                            <p class="text-[10px] uppercase tracking-[0.18em] font-black text-slate-400">Módulos no filtro</p>
                            <p data-dashboard-number="public-selected-modules" data-target="${selectedModulesCount}" class="mt-1 text-2xl font-black text-slate-800">${selectedModulesCount}</p>
                        </div>
                        <div class="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                            <p class="text-[10px] uppercase tracking-[0.18em] font-black text-slate-400">Taxa de conclusão</p>
                            <p data-dashboard-number="public-completion-rate" data-target="${completionRate}" data-suffix="%" class="mt-1 text-2xl font-black text-slate-800">${completionRate}%</p>
                        </div>
                    </div>

                    <div class="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <div class="flex items-center justify-between gap-3">
                            <h3 class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Status do treinamento</h3>
                            <span class="text-[10px] font-bold text-slate-400">Visão geral</span>
                        </div>
                        ${totalStatusRecords ? `
                            <div class="mt-4 space-y-4">
                                <div class="flex items-center justify-center">${publicPieMarkup}</div>
                                <div class="space-y-2.5">
                                    ${statusChartItems.map((item) => {
                                        const percentageLabel = formatStatusPercentage(item.count, totalStatusRecords, { fractionDigits: 1 });
                                        return `
                                            <div class="flex items-center justify-between gap-3 text-sm">
                                                <div class="flex items-center gap-2 min-w-0">
                                                    <span class="w-3 h-3 rounded-full shrink-0" style="background:${item.color};"></span>
                                                    <span class="font-semibold text-slate-700 truncate">${escapeHtml(item.label)}</span>
                                                </div>
                                                <span data-dashboard-number="public-status-${escapeAttr(normalizeComparisonKey(item.status))}" data-target="${item.count}" data-suffix=" (${percentageLabel})" class="text-slate-500 font-bold">${item.count} (${percentageLabel})</span>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                                <p class="text-xs text-slate-400">
                                    Base analisada: ${distribution.filteredUsers.length} usuário(s), ${selectedModulesCount} módulo(s), ${totalStatusRecords} registro(s).
                                </p>
                            </div>
                        ` : `
                            <div class="mt-4 space-y-3">
                                <div class="w-56 h-56 mx-auto rounded-full bg-slate-200 border-8 border-white"></div>
                                <p class="text-sm text-slate-400 text-center">
                                    Selecione categorias e módulos com dados para montar o gráfico.
                                </p>
                            </div>
                        `}
                    </div>

                    <div class="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <div class="flex items-center justify-between gap-3">
                            <h3 class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Usuários por cargo</h3>
                            <span class="text-[10px] font-bold text-slate-400">Filtro atual</span>
                        </div>
                        ${filteredRoleDistribution.length ? `
                            <div class="mt-3 space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                                ${filteredRoleDistribution.map((item) => `
                                    <div>
                                        <div class="flex items-center justify-between gap-2 text-xs">
                                            <span class="font-semibold text-slate-700 truncate">${escapeHtml(item.role)}</span>
                                            <span class="text-slate-500 font-bold">${item.count}</span>
                                        </div>
                                        <div class="mt-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                                            <div class="h-full rounded-full bg-slate-700" style="width:${Math.min(100, Math.max(0, Math.round((item.count / maxRoleCount) * 100)))}%;"></div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <p class="mt-3 text-sm text-slate-400">Nenhum cargo disponível para o filtro atual.</p>
                        `}
                    </div>
                </aside>
            </div>
        </div>
    `;
}

function getDashboardInsights() {
    const roleCounts = new Map();
    const activeUsers = getUsersByActivity();

    for (const user of activeUsers) {
        const role = String(user.role || '').trim() || 'Nao informado';
        roleCounts.set(role, (roleCounts.get(role) || 0) + 1);
    }

    const roleDistribution = [...roleCounts.entries()]
        .map(([role, count]) => ({ role, count }))
        .sort((a, b) => b.count - a.count || a.role.localeCompare(b.role, 'pt-BR', { sensitivity: 'base' }));

    return {
        totalUsers: activeUsers.length,
        roleDistribution,
    };
}

function getDashboardStatusDistribution(filterState) {
    const filteredUsers = getUsersForMatrixView(filterState);
    const matrixCategories = getVisibleMatrixCategories(filterState);
    const counts = {
        [MODULE_STATUS.COMPLETED]: 0,
        [MODULE_STATUS.NOT_COMPLETED]: 0,
        [MODULE_STATUS.SCHEDULED]: 0,
        [MODULE_STATUS.NOT_PARTICIPATING]: 0,
    };

    let totalRecords = 0;
    for (const user of filteredUsers) {
        for (const category of matrixCategories) {
            const assigned = user.categoryIds.includes(category.id);
            for (const module of category.modules) {
                const rawStatus = assigned
                    ? getModuleStatus(user, category.id, module.id)
                    : MODULE_STATUS.NOT_PARTICIPATING;
                const normalizedStatus = normalizeModuleStatus(rawStatus);
                counts[normalizedStatus] = (counts[normalizedStatus] || 0) + 1;
                totalRecords += 1;
            }
        }
    }

    return {
        filteredUsers,
        matrixCategories,
        counts,
        totalRecords,
    };
}

// Dashboard principal: métricas, distribuição por cargo e status por filtros.
function renderDashboard(container) {
    const insights = getDashboardInsights();
    const filterState = getMatrixFilterState('dashboard');
    const distribution = getDashboardStatusDistribution(filterState);
    const maxRoleCount = Math.max(...insights.roleDistribution.map((item) => item.count), 1);
    const selectedModulesCount = distribution.matrixCategories
        .reduce((sum, category) => sum + category.modules.length, 0);

    const statusChartItems = [
        {
            status: MODULE_STATUS.COMPLETED,
            label: 'Concluído',
            color: '#10b981',
            count: distribution.counts[MODULE_STATUS.COMPLETED],
        },
        {
            status: MODULE_STATUS.NOT_COMPLETED,
            label: 'Não Concluído',
            color: '#f43f5e',
            count: distribution.counts[MODULE_STATUS.NOT_COMPLETED],
        },
        {
            status: MODULE_STATUS.SCHEDULED,
            label: 'Agendado',
            color: '#f59e0b',
            count: distribution.counts[MODULE_STATUS.SCHEDULED],
        },
        {
            status: MODULE_STATUS.NOT_PARTICIPATING,
            label: 'Não inscrito',
            color: '#475569',
            count: distribution.counts[MODULE_STATUS.NOT_PARTICIPATING],
        },
    ];

    const totalStatusRecords = distribution.totalRecords;
    const dashboardPieMarkup = getStatusPieChartMarkup(statusChartItems, totalStatusRecords, {
        size: 184,
        chartId: 'dashboard-status-pie',
    });

    const matrixMarkup = getMatrixSectionMarkup(
        'Editar Status',
        'Principal visão do painel: acompanhe quem concluiu cada módulo.'
    );

    container.innerHTML = `
        <div class="space-y-8">
            <div class="space-y-5">
                <div class="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h2 class="text-2xl font-bold text-slate-100">Painel de Indicadores</h2>
                        <p class="text-sm text-slate-300">Visão direta de usuários, cargos e status dos treinamentos por categoria/módulo.</p>
                    </div>
                </div>

                ${getMatrixFiltersMarkup('dashboard')}

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <p class="text-[11px] uppercase tracking-[0.2em] font-black text-slate-400">Total de usuários</p>
                        <p data-dashboard-number="total-users" data-target="${insights.totalUsers}" class="mt-2 text-3xl font-black text-slate-800">${insights.totalUsers}</p>
                        <p class="mt-1 text-xs text-slate-500">base completa cadastrada</p>
                    </div>
                    <div class="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <p class="text-[11px] uppercase tracking-[0.2em] font-black text-slate-400">Usuários filtrados</p>
                        <p data-dashboard-number="filtered-users" data-target="${distribution.filteredUsers.length}" class="mt-2 text-3xl font-black text-slate-800">${distribution.filteredUsers.length}</p>
                        <p class="mt-1 text-xs text-slate-500">considerando busca e cargo</p>
                    </div>
                    <div class="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <p class="text-[11px] uppercase tracking-[0.2em] font-black text-slate-400">Módulos filtrados</p>
                        <p data-dashboard-number="selected-modules" data-target="${selectedModulesCount}" class="mt-2 text-3xl font-black text-slate-800">${selectedModulesCount}</p>
                        <p class="mt-1 text-xs text-slate-500">dentro das categorias selecionadas</p>
                    </div>
                </div>

                <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <div class="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <div class="flex items-center justify-between gap-3">
                            <h3 class="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Usuários por cargo</h3>
                            <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Distribuição</span>
                        </div>
                        ${insights.roleDistribution.length ? `
                            <div class="mt-4 space-y-3 max-h-[220px] overflow-y-auto pr-1">
                                ${insights.roleDistribution.map((item) => `
                                    <div>
                                        <div class="flex items-center justify-between gap-2 text-xs">
                                            <span class="font-semibold text-slate-700 truncate">${escapeHtml(item.role)}</span>
                                            <span class="text-slate-500 font-bold">${item.count}</span>
                                        </div>
                                        <div class="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                                            <div class="h-full rounded-full bg-slate-700" style="width:${Math.min(100, Math.max(0, Math.round((item.count / maxRoleCount) * 100)))}%;"></div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <p class="mt-4 text-sm text-slate-400">Nenhum cargo disponível.</p>
                        `}
                    </div>

                    <div class="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <div class="flex items-center justify-between gap-3">
                            <h3 class="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Status do treinamento</h3>
                            <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Distribuição por status</span>
                        </div>
                        ${totalStatusRecords ? `
                            <div class="mt-4 grid grid-cols-1 md:grid-cols-[170px_1fr] gap-4 items-center">
                                <div class="flex items-center justify-center">${dashboardPieMarkup}</div>
                                <div class="space-y-2.5">
                                    ${statusChartItems.map((item) => {
                                        const percentageLabel = formatStatusPercentage(item.count, totalStatusRecords, { fractionDigits: 1 });
                                        return `
                                            <div class="flex items-center justify-between gap-3 text-sm">
                                                <div class="flex items-center gap-2 min-w-0">
                                                    <span class="w-3 h-3 rounded-full shrink-0" style="background:${item.color};"></span>
                                                    <span class="font-semibold text-slate-700 truncate">${escapeHtml(item.label)}</span>
                                                </div>
                                                <span data-dashboard-number="status-${escapeAttr(normalizeComparisonKey(item.status))}" data-target="${item.count}" data-suffix=" (${percentageLabel})" class="text-slate-500 font-bold">${item.count} (${percentageLabel})</span>
                                            </div>
                                        `;
                                    }).join('')}
                                    <p class="pt-2 text-xs text-slate-400">
                                        Base: ${distribution.filteredUsers.length} usuário(s) x ${selectedModulesCount} módulo(s) selecionado(s) = ${totalStatusRecords} registro(s).
                                    </p>
                                </div>
                            </div>
                        ` : `
                            <div class="mt-6 space-y-3">
                                <div class="w-40 h-40 mx-auto rounded-full bg-slate-200 border-8 border-white"></div>
                                <p class="text-sm text-slate-400 text-center">
                                    Selecione categorias e módulos com dados para gerar o gráfico de status.
                                </p>
                            </div>
                        `}
                    </div>
                </div>
            </div>

            ${matrixMarkup}
        </div>
    `;
}

function animateDashboardIndicators() {
    const mainView = document.getElementById('main-view');
    if (!mainView || !['dashboard', 'public-overview'].includes(state.activeTab)) {
        return;
    }

    const numberNodes = Array.from(mainView.querySelectorAll('[data-dashboard-number]'));
    const durationMs = 520;
    const startAt = performance.now();

    numberNodes.forEach((node) => {
        const key = String(node.dataset.dashboardNumber || '').trim();
        if (!key) {
            return;
        }

        const target = Number(node.dataset.target || 0);
        const previousRaw = state.dashboardAnimationValues[key];
        const start = Number.isFinite(previousRaw) ? Number(previousRaw) : 0;
        const suffix = String(node.dataset.suffix || '');

        node.textContent = `${Math.round(start)}${suffix}`;

        const animateFrame = (now) => {
            const progress = Math.min(1, (now - startAt) / durationMs);
            const eased = 1 - ((1 - progress) * (1 - progress) * (1 - progress));
            const nextValue = start + ((target - start) * eased);
            node.textContent = `${Math.round(nextValue)}${suffix}`;
            if (progress < 1) {
                window.requestAnimationFrame(animateFrame);
                return;
            }
            node.textContent = `${Math.round(target)}${suffix}`;
            state.dashboardAnimationValues[key] = target;
        };

        window.requestAnimationFrame(animateFrame);
    });

}

function renderCategories(container) {
    const actionsBlocked = isPending('loadData') || isPending('saveCategory') || isPending('deleteCategory');
    container.innerHTML = `
        <div class="space-y-6 ${state.currentViewAnimationClass}">
            <div class="flex justify-between items-center gap-4 flex-wrap">
                <div>
                    <h2 class="text-2xl font-bold text-slate-100">Gestão de Categorias</h2>
                    <p class="text-sm text-slate-400">Crie, edite e exclua categorias com seus módulos.</p>
                </div>
                <button onclick="openModal('category')" ${actionsBlocked ? 'disabled' : ''} class="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed">
                    <i data-lucide="plus" class="w-5 h-5"></i> Nova Categoria
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${state.categories.length ? state.categories.map((category) => {
                    const isExpanded = state.expandedCategoryId === category.id;
                    const assignedUsersCount = state.users.filter((user) => user.categoryIds.includes(category.id)).length;
                    const isInlineEditing = state.inlineModuleEditor.categoryId === category.id;
                    const inlineModules = isInlineEditing ? state.inlineModuleEditor.modules : [];
                    return `
                        <div class="relative rounded-2xl border border-slate-100 bg-white ${isExpanded ? 'z-30 overflow-visible' : 'z-0'}">
                            <div class="p-5">
                                <div class="flex items-start justify-between gap-3">
                                    <button onclick="toggleCategoryModules('${category.id}')" class="flex items-start gap-3 text-left min-w-0 flex-1">
                                        <span class="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0"><i data-lucide="layers"></i></span>
                                        <span class="min-w-0">
                                            <span class="block text-lg font-bold truncate text-slate-800">${escapeHtml(category.name)}</span>
                                            <span class="block text-xs text-slate-400 font-bold uppercase tracking-wider">${category.modules.length} módulos - ${assignedUsersCount} usuários</span>
                                        </span>
                                        <span class="text-slate-400 shrink-0 mt-1"><i data-lucide="${isExpanded ? 'chevron-up' : 'chevron-down'}" class="w-5 h-5"></i></span>
                                    </button>
                                    <div class="flex items-center gap-2 shrink-0">
                                        <button onclick="viewCategory('${category.id}')" class="px-3 py-2 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all">
                                            Ver usuários
                                        </button>
                                        ${isExpanded ? `
                                            <button onclick="editCategory('${category.id}')" ${actionsBlocked ? 'disabled' : ''} class="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-lg border border-slate-100 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                                                <i data-lucide="edit-2" class="w-4 h-4"></i>
                                            </button>
                                        ` : ''}
                                        <button onclick="deleteCategory('${category.id}')" ${actionsBlocked ? 'disabled' : ''} class="p-2 bg-red-50 text-red-400 hover:text-red-600 rounded-lg border border-red-100 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                                        </button>
                                    </div>
                                </div>
                                ${isExpanded ? `
                                    <div class="absolute left-0 right-0 top-full mt-2 z-40 rounded-xl border border-slate-100 bg-slate-50/95 p-4 shadow-xl animate-fade-in">
                                        <div class="flex items-center justify-between gap-2">
                                            <p class="text-[11px] text-slate-500 font-black uppercase tracking-[0.2em]">Módulos cadastrados</p>
                                            ${isInlineEditing ? `
                                                <div class="flex items-center gap-2">
                                                    <button onclick="addInlineModuleDraft()" ${actionsBlocked ? 'disabled' : ''} class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed">
                                                        Adicionar
                                                    </button>
                                                    <button onclick="cancelInlineModuleEdit()" ${actionsBlocked ? 'disabled' : ''} class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed">
                                                        Cancelar
                                                    </button>
                                                    <button onclick="saveInlineModuleEdit('${category.id}')" ${actionsBlocked ? 'disabled' : ''} class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed">
                                                        Salvar
                                                    </button>
                                                </div>
                                            ` : `
                                                <button onclick="startInlineModuleEdit('${category.id}')" ${actionsBlocked ? 'disabled' : ''} class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-1.5">
                                                    <i data-lucide="square-pen" class="w-3.5 h-3.5"></i>
                                                    Editar módulos
                                                </button>
                                            `}
                                        </div>
                                        ${isInlineEditing ? `
                                            <div class="mt-3 space-y-2">
                                                ${inlineModules.length ? inlineModules.map((module, index) => {
                                                    const moduleName = String(module.name || '');
                                                    const isModuleEditing = state.inlineModuleEditor.editingIndex === index;
                                                    return `
                                                        <div class="px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-700 flex items-center gap-2">
                                                            <span class="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-black flex items-center justify-center shrink-0">${index + 1}</span>
                                                            ${isModuleEditing ? `
                                                                <input
                                                                    id="inline-module-input-${index}"
                                                                    type="text"
                                                                    value="${escapeAttr(moduleName)}"
                                                                    oninput="updateInlineModuleDraft(${index}, this.value)"
                                                                    onkeydown="handleInlineModuleInputKeydown(event, ${index})"
                                                                    class="flex-1 px-2 py-1 rounded-md bg-slate-50 border border-slate-200 text-sm outline-none focus:border-indigo-400"
                                                                >
                                                            ` : `
                                                                <span class="flex-1 truncate font-semibold ${moduleName.trim() ? 'text-slate-700' : 'text-slate-400 italic'}">${escapeHtml(moduleName.trim() || 'Sem nome')}</span>
                                                            `}
                                                            <button onclick="${isModuleEditing ? `finishInlineModuleFieldEdit(${index})` : `beginInlineModuleFieldEdit(${index})`}" class="p-1.5 rounded-md bg-slate-50 text-slate-500 hover:text-indigo-600 border border-slate-200" title="${isModuleEditing ? 'Concluir edição' : 'Editar nome do módulo'}">
                                                                <i data-lucide="${isModuleEditing ? 'check' : 'pencil'}" class="w-3.5 h-3.5"></i>
                                                            </button>
                                                            <button onclick="confirmInlineModuleDeletion(${index})" class="p-1.5 rounded-md bg-red-50 text-red-500 hover:text-red-700 border border-red-100" title="Excluir módulo">
                                                                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                                                            </button>
                                                        </div>
                                                    `;
                                                }).join('') : `
                                                    <p class="text-sm text-slate-400">Adicione ao menos um módulo.</p>
                                                `}
                                            </div>
                                        ` : category.modules.length ? `
                                            <div class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                ${category.modules.map((module, index) => `
                                                    <div class="px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-700 flex items-center gap-2">
                                                        <span class="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-black flex items-center justify-center">${index + 1}</span>
                                                        <span class="truncate font-semibold">${escapeHtml(module.name)}</span>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        ` : `
                                            <p class="mt-3 text-sm text-slate-400">Esta categoria ainda não possui módulos.</p>
                                        `}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }).join('') : `
                    <div class="md:col-span-2 p-8 bg-white rounded-2xl border border-dashed border-slate-200 text-center text-slate-500">
                        Nenhuma categoria foi criada ainda.
                    </div>
                `}
            </div>
        </div>
    `;
}

function renderReport(container) {
    const filteredUsers = getUsersForMatrixView(state.reportMatrixFilters);
    const matrixCategories = getVisibleMatrixCategories(state.reportMatrixFilters);

    container.innerHTML = `
        <div class="space-y-6 ${state.currentViewAnimationClass}">
            ${getMatrixFiltersMarkup('report')}
            ${getMatrixSectionMarkup('Editar Status', 'Visão global de todos os módulos por usuário', { filteredUsers, matrixCategories })}
        </div>
    `;
}

function renderUsers(container) {
    const filteredUsers = getUsersForManagement();
    const draftStats = getUserCategoryDraftStats();
    const hasQuickCategoryDrafts = draftStats.dirty > 0;
    const isQuickCategorySaving = draftStats.saving > 0;
    const isBulkSelectionMode = Boolean(state.userBulkSelectionMode);
    const selectedUsers = getSelectedUsersForBulk();
    const selectedUsersCount = selectedUsers.length;
    const selectedActiveUsersCount = selectedUsers.filter((user) => isUserActive(user)).length;
    const isBulkActionPending = isPending('bulkUserAction');
    const actionsBlocked = isPending('loadData')
        || isPending('saveUser')
        || isPending('deleteUser')
        || isPending('toggleUserActive')
        || isPending('importUsers')
        || isPending('normalizeRoles')
        || isBulkActionPending
        || isQuickCategorySaving;
    const rowActionsBlocked = actionsBlocked || isBulkSelectionMode;
    const roleOptions = [...new Set(state.users.map((user) => user.role).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));

    const PAGE_SIZE = USER_PAGE_SIZE;
    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
    const safePage = Math.min(state.userListPage || 0, totalPages - 1);
    const pagedUsers = filteredUsers.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
    const paginationMarkup = totalPages > 1 ? `
        <div class="flex items-center justify-between gap-4 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
            <span class="text-[11px] font-bold text-slate-500">${filteredUsers.length} usuário(s) — página ${safePage + 1} de ${totalPages}</span>
            <div class="flex items-center gap-2">
                <button onclick="setUserListPage(${safePage - 1})" ${safePage === 0 ? 'disabled' : ''} class="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">← Anterior</button>
                <button onclick="setUserListPage(${safePage + 1})" ${safePage >= totalPages - 1 ? 'disabled' : ''} class="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Próxima →</button>
            </div>
        </div>
    ` : '';
    const adminsPanelMarkup = `
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h3 class="text-base font-bold text-slate-800 flex items-center gap-2">
                        <i data-lucide="shield-check" class="w-4 h-4 text-amber-500"></i>
                        Administradores do Portal
                    </h3>
                    <p class="text-xs text-slate-400 mt-0.5">Contas com acesso ao painel administrativo.</p>
                </div>
            </div>
            ${state.adminListError === 'tabela_nao_existe' ? `
                <div class="p-5 space-y-3">
                    <p class="text-sm text-slate-500">Para habilitar a gestão de admins, crie a tabela <code class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-mono">portal_admins</code> no Supabase com o SQL abaixo:</p>
                    <pre class="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-700 overflow-x-auto whitespace-pre-wrap">CREATE TABLE portal_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  created_by text
);
ALTER TABLE portal_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_select" ON portal_admins FOR SELECT USING (auth.role() = 'authenticated' AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);
CREATE POLICY "admins_insert" ON portal_admins FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);
CREATE POLICY "admins_update" ON portal_admins FOR UPDATE USING (auth.role() = 'authenticated' AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE) WITH CHECK (auth.role() = 'authenticated' AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);
CREATE POLICY "admins_delete" ON portal_admins FOR DELETE USING (auth.role() = 'authenticated' AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);</pre>
                </div>
            ` : state.adminListError ? `
                <div class="p-5 text-sm text-red-600">${escapeHtml(state.adminListError)}</div>
            ` : state.admins.length ? `
                <div class="divide-y divide-slate-100">
                    ${state.admins.map((admin) => {
                        const isSelf = admin.email === state.session?.user?.email;
                        return `
                            <div class="px-5 py-3 flex items-center justify-between gap-3 group">
                                <div class="flex items-center gap-3 min-w-0">
                                    <div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                        <i data-lucide="shield-check" class="w-4 h-4"></i>
                                    </div>
                                    <div class="min-w-0">
                                        <p class="text-sm font-bold text-slate-700 truncate">${escapeHtml(admin.email)}</p>
                                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                            ${isSelf ? 'Você • Admin' : 'Admin'}
                                            ${admin.created_by ? ` • Criado por ${escapeHtml(admin.created_by)}` : ''}
                                        </p>
                                    </div>
                                </div>
                                ${!isSelf ? `
                                    <div class="flex items-center gap-1">
                                        <button
                                            onclick="openModal('admin-edit', '${admin.id}')"
                                            ${isPending('deleteAdmin') || isPending('updateAdmin') ? 'disabled' : ''}
                                            title="Editar admin"
                                            class="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-transparent hover:border-indigo-100 transition-all opacity-60 group-hover:opacity-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            <i data-lucide="pencil" class="w-4 h-4"></i>
                                        </button>
                                        <button
                                            onclick="deleteAdminRecord('${admin.id}')"
                                            ${isPending('deleteAdmin') || isPending('updateAdmin') ? 'disabled' : ''}
                                            title="Remover acesso de admin"
                                            class="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-all opacity-60 group-hover:opacity-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            <i data-lucide="user-minus" class="w-4 h-4"></i>
                                        </button>
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            ` : `
                <div class="p-5 text-center text-sm text-slate-400">
                    Nenhum admin registrado ainda. Use "Novo Admin" acima para criar.
                </div>
            `}
        </div>
    `;

    container.innerHTML = `
        <div class="space-y-6 ${state.currentViewAnimationClass}">
            <div class="flex justify-between items-center gap-4 flex-wrap">
                <div>
                    <h2 class="text-2xl font-bold text-slate-100">Gestão de Usuários</h2>
                    <p class="text-sm text-slate-400">Mantenha os colaboradores e suas categorias sincronizados no Supabase.</p>
                </div>
                <div class="flex items-center gap-2">
                    <input id="user-import-input" type="file" accept=".csv,text/csv" class="hidden" onchange="handleUserCsvSelected(event)">
                    <button onclick="downloadUsersCsvTemplate()" class="px-4 py-2.5 bg-white text-slate-600 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 flex items-center gap-2">
                        <i data-lucide="file-down" class="w-4 h-4"></i> Modelo CSV
                    </button>
                    <button onclick="triggerUserCsvImport()" ${actionsBlocked ? 'disabled' : ''} class="px-4 py-2.5 bg-white text-slate-700 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                        <i data-lucide="upload" class="w-4 h-4"></i> Importar CSV
                    </button>
                    <button onclick="normalizeAllUserRoles()" ${actionsBlocked ? 'disabled' : ''} class="px-4 py-2.5 bg-white text-slate-700 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                        <i data-lucide="wand-sparkles" class="w-4 h-4"></i> Padronizar Cargos
                    </button>
                    <button onclick="openModal('admin-create')" ${actionsBlocked ? 'disabled' : ''} class="px-4 py-2.5 bg-white text-slate-700 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                        <i data-lucide="user-plus" class="w-4 h-4"></i> Novo Admin
                    </button>
                    <button onclick="openModal('user')" ${actionsBlocked ? 'disabled' : ''} class="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed">
                        <i data-lucide="plus" class="w-5 h-5"></i> Novo Usuário
                    </button>
                    <button onclick="toggleUserBulkSelectionMode()" ${actionsBlocked && !isBulkSelectionMode ? 'disabled' : ''} class="px-4 py-2.5 ${isBulkSelectionMode ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200'} rounded-xl font-bold border hover:bg-slate-50 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                        <i data-lucide="check-square" class="w-4 h-4"></i> ${isBulkSelectionMode ? 'Cancelar seleção' : 'Selecionar'}
                    </button>
                </div>
            </div>
            <div class="bg-white rounded-2xl border border-slate-100 p-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase">Cargo</label>
                        <select onchange="setUserListRoleFilter(this.value)" class="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-400">
                            <option value="all" ${state.userListFilters.role === 'all' ? 'selected' : ''}>Todos</option>
                            ${roleOptions.map((role) => `
                                <option value="${escapeAttr(role)}" ${state.userListFilters.role === role ? 'selected' : ''}>${escapeHtml(role)}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase">Status</label>
                        <select onchange="setUserListActiveFilter(this.value)" class="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-400">
                            <option value="all" ${state.userListFilters.active === 'all' ? 'selected' : ''}>Todos</option>
                            <option value="active" ${state.userListFilters.active === 'active' ? 'selected' : ''}>Ativos</option>
                            <option value="inactive" ${state.userListFilters.active === 'inactive' ? 'selected' : ''}>Inativos</option>
                        </select>
                    </div>
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase">Ordem</label>
                        <select onchange="setUserListSort(this.value)" class="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-400">
                            <option value="name-asc" ${state.userListFilters.sort === 'name-asc' ? 'selected' : ''}>Nome A-Z</option>
                            <option value="name-desc" ${state.userListFilters.sort === 'name-desc' ? 'selected' : ''}>Nome Z-A</option>
                            <option value="role-asc" ${state.userListFilters.sort === 'role-asc' ? 'selected' : ''}>Cargo A-Z</option>
                            <option value="role-desc" ${state.userListFilters.sort === 'role-desc' ? 'selected' : ''}>Cargo Z-A</option>
                        </select>
                    </div>
                </div>
                <div class="mt-3 flex flex-wrap items-center gap-2">
                    <span class="text-[10px] font-bold text-slate-400 uppercase">Categoria:</span>
                    <button onclick="setUserListCategoryFilter('all')" class="px-2.5 py-1 rounded-full text-[10px] font-bold border ${state.userListFilters.categoryId === 'all' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600'}">Todas</button>
                    ${state.categories.map((category) => `
                        <button
                            data-category-id="${escapeAttr(category.id)}"
                            onclick="setUserListCategoryFilter(this.dataset.categoryId)"
                            class="px-2.5 py-1 rounded-full text-[10px] font-bold border ${state.userListFilters.categoryId === category.id ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600'}"
                        >
                            ${escapeHtml(category.name)}
                        </button>
                    `).join('')}
                    <button onclick="clearUserListFilters()" class="ml-auto px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">
                        Limpar filtros
                    </button>
                </div>
            </div>
            ${isBulkSelectionMode ? `
                <div class="bg-slate-900/90 backdrop-blur border border-slate-700 rounded-2xl px-4 py-3 text-slate-100 flex items-center justify-between gap-3 flex-wrap">
                    <div class="space-y-0.5">
                        <p class="text-sm font-bold">
                            ${selectedUsersCount
                                ? `${formatCountLabel(selectedUsersCount, 'usuário selecionado', 'usuários selecionados')}.`
                                : 'Selecione usuários na lista abaixo.'}
                        </p>
                        <p class="text-[11px] text-slate-300">
                            ${selectedUsersCount
                                ? `${formatCountLabel(selectedActiveUsersCount, 'ativo', 'ativos')} pronto(s) para inativação em lote.`
                                : 'Você pode selecionar vários usuários para inativar ou excluir de uma vez.'}
                        </p>
                    </div>
                    <div class="flex items-center gap-2 flex-wrap">
                        <button onclick="selectAllUsersFromCurrentFilter()" ${actionsBlocked ? 'disabled' : ''} class="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed">
                            Selecionar todos
                        </button>
                        <button onclick="selectAllUsersOnCurrentPage()" ${actionsBlocked ? 'disabled' : ''} class="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed">
                            Selecionar página
                        </button>
                        <button onclick="clearUserBulkSelection()" ${actionsBlocked || !selectedUsersCount ? 'disabled' : ''} class="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed">
                            Limpar seleção
                        </button>
                        <button onclick="inactivateSelectedUsers()" ${actionsBlocked || !selectedUsersCount ? 'disabled' : ''} class="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed">
                            Inativar selecionados
                        </button>
                        <button onclick="deleteSelectedUsers()" ${actionsBlocked || !selectedUsersCount ? 'disabled' : ''} class="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500 text-white hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed">
                            Excluir selecionados
                        </button>
                    </div>
                </div>
            ` : ''}
            ${adminsPanelMarkup}
            <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div class="lg:hidden users-table-scroll max-h-[520px] overflow-y-auto p-3 sm:p-4 space-y-3 bg-slate-50/60" data-scroll-key="users-management-mobile-list">
                    ${pagedUsers.length ? pagedUsers.map((user) => `
                        <article class="rounded-2xl border ${isUserSelectedForBulk(user.id) ? 'border-indigo-300 ring-1 ring-indigo-200' : (isUserActive(user) ? 'border-slate-200 bg-white' : 'border-amber-200 bg-amber-50/30')} p-3 space-y-3">
                            <div class="flex items-start justify-between gap-3">
                                <div class="min-w-0 flex items-center gap-3">
                                    <div class="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] uppercase font-bold shrink-0">
                                        ${escapeHtml(`${user.firstName[0] || ''}${user.lastName[0] || ''}`)}
                                    </div>
                                    <div class="min-w-0">
                                        <p class="text-sm font-bold text-slate-800 truncate">${escapeHtml(user.fullName)}</p>
                                        <p class="text-[10px] text-slate-400 font-bold uppercase">${escapeHtml(user.role)}</p>
                                        <p class="mt-1 text-[10px] font-bold uppercase tracking-wide ${isUserActive(user) ? 'text-emerald-600' : 'text-amber-600'}">
                                            ${isUserActive(user) ? 'Ativo' : 'Inativo'}
                                        </p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-1.5 shrink-0">
                                    ${isBulkSelectionMode ? `
                                        <button onclick="toggleUserBulkSelection('${user.id}')" ${actionsBlocked ? 'disabled' : ''} title="${isUserSelectedForBulk(user.id) ? 'Remover da seleção' : 'Selecionar usuário'}" class="p-1.5 ${isUserSelectedForBulk(user.id) ? 'text-indigo-600 border-indigo-300 bg-indigo-50' : 'text-slate-400'} bg-white rounded-lg border border-slate-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                                            <i data-lucide="${isUserSelectedForBulk(user.id) ? 'check-square' : 'square'}" class="w-4 h-4"></i>
                                        </button>
                                    ` : ''}
                                    <button onclick="toggleUserActive('${user.id}')" ${rowActionsBlocked ? 'disabled' : ''} title="${isUserActive(user) ? 'Inativar usuário' : 'Ativar usuário'}" class="p-1.5 ${isUserActive(user) ? 'text-amber-500 hover:text-amber-700' : 'text-emerald-500 hover:text-emerald-700'} bg-white rounded-lg border border-slate-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                                        <i data-lucide="${isUserActive(user) ? 'user-x' : 'user-check'}" class="w-4 h-4"></i>
                                    </button>
                                    <button onclick="editUser('${user.id}')" ${rowActionsBlocked ? 'disabled' : ''} class="p-1.5 text-slate-400 hover:text-indigo-600 bg-white rounded-lg border border-slate-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                                        <i data-lucide="edit-2" class="w-4 h-4"></i>
                                    </button>
                                    <button onclick="deleteUser('${user.id}')" ${rowActionsBlocked ? 'disabled' : ''} class="p-1.5 text-slate-400 hover:text-red-500 bg-white rounded-lg border border-slate-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="space-y-1 text-[11px] text-slate-500 break-all">
                                <div>
                                    <span class="font-bold uppercase text-slate-400">E-mail:</span>
                                    <span class="font-semibold">${escapeHtml(user.email || '-')}</span>
                                </div>
                                <div>
                                    <span class="font-bold uppercase text-slate-400">ID:</span>
                                    <span class="font-semibold">${escapeHtml(user.externalId)}</span>
                                </div>
                            </div>
                            <div class="space-y-1.5">
                                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Categorias</p>
                                <div class="flex gap-1.5 flex-wrap">
                                    ${state.categories.length
                                        ? state.categories.map((category) => {
                                            const activeCategoryIds = getEffectiveUserCategoryIds(user);
                                            const active = activeCategoryIds.includes(category.id);
                                            return `
                                                <button onclick="toggleUserCategoryQuick('${user.id}', '${category.id}')" ${rowActionsBlocked ? 'disabled' : ''} class="px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${active ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600'} disabled:opacity-60 disabled:cursor-not-allowed">
                                                    ${escapeHtml(category.name)}
                                                </button>
                                            `;
                                        }).join('')
                                        : '<span class="text-xs text-slate-300">Sem categorias cadastradas</span>'}
                                </div>
                            </div>
                        </article>
                    `).join('') : `
                        <div class="px-4 py-8 rounded-2xl bg-white border border-slate-100 text-center text-slate-400">
                            Nenhum usuário cadastrado ainda.
                        </div>
                    `}
                    ${paginationMarkup}
                </div>
                <div class="hidden lg:block fixed-scroll-target users-table-scroll w-full max-w-full overflow-x-auto" data-scroll-key="users-management-table">
                    <div class="users-table-scroll max-h-[620px] overflow-y-auto" data-scroll-key="users-management-table-vertical">
                    <table class="w-full min-w-max text-left">
                        <thead class="bg-slate-50 border-b sticky top-0 z-10">
                            <tr>
                                ${isBulkSelectionMode ? `<th class="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Selecionar</th>` : ''}
                                <th class="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Nome</th>
                                <th class="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Cargo</th>
                                <th class="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">E-mail</th>
                                <th class="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">ID Externo</th>
                                <th class="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Categorias (edição em lote)</th>
                                <th class="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            ${pagedUsers.length ? pagedUsers.map((user) => `
                                <tr class="${isUserSelectedForBulk(user.id) ? 'bg-indigo-50/60' : (isUserCategoryDraftSaving(user.id) ? 'bg-amber-50/40' : (isUserActive(user) ? 'hover:bg-slate-50/50' : 'bg-slate-50/70'))} group transition-colors">
                                    ${isBulkSelectionMode ? `
                                        <td class="px-3 py-3 text-center">
                                            <button onclick="toggleUserBulkSelection('${user.id}')" ${actionsBlocked ? 'disabled' : ''} title="${isUserSelectedForBulk(user.id) ? 'Remover da seleção' : 'Selecionar usuário'}" class="inline-flex items-center justify-center p-1.5 rounded-lg border transition-all ${isUserSelectedForBulk(user.id) ? 'border-indigo-300 bg-indigo-50 text-indigo-600' : 'border-slate-200 bg-white text-slate-400 hover:text-indigo-600'} disabled:opacity-60 disabled:cursor-not-allowed">
                                                <i data-lucide="${isUserSelectedForBulk(user.id) ? 'check-square' : 'square'}" class="w-4 h-4"></i>
                                            </button>
                                        </td>
                                    ` : ''}
                                    <td class="px-4 py-3">
                                        <div class="flex items-center gap-2.5 font-bold text-slate-700 text-[13px]">
                                            <div class="w-7 h-7 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center text-[9px] uppercase">
                                                ${escapeHtml(`${user.firstName[0] || ''}${user.lastName[0] || ''}`)}
                                            </div>
                                            ${escapeHtml(user.fullName)}
                                        </div>
                                    </td>
                                    <td class="px-4 py-3 text-[11px] text-slate-500 font-medium">
                                        <div class="space-y-1">
                                            <p>${escapeHtml(user.role)}</p>
                                            <span class="inline-flex px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wide ${isUserActive(user) ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}">
                                                ${isUserActive(user) ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </div>
                                    </td>
                                    <td class="px-4 py-3 text-[11px] text-slate-500 font-medium break-all">${escapeHtml(user.email || '-')}</td>
                                    <td class="px-4 py-3 text-[11px] text-slate-500 font-medium">${escapeHtml(user.externalId)}</td>
                                    <td class="px-4 py-3">
                                        <div class="flex gap-1.5 flex-wrap items-center">
                                            ${isUserCategoryDraftSaving(user.id) ? `<span class="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600"><i data-lucide="loader-circle" class="w-3 h-3 animate-spin"></i> Salvando...</span>` : ''}
                                            ${state.categories.length
                                                ? state.categories.map((category) => {
                                                    const activeCategoryIds = getEffectiveUserCategoryIds(user);
                                                    const active = activeCategoryIds.includes(category.id);
                                                    return `
                                                        <button onclick="toggleUserCategoryQuick('${user.id}', '${category.id}')" ${rowActionsBlocked ? 'disabled' : ''} class="px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${active ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600'} disabled:opacity-60 disabled:cursor-not-allowed">
                                                            ${escapeHtml(category.name)}
                                                        </button>
                                                    `;
                                                }).join('')
                                                : '<span class="text-xs text-slate-300">Sem categorias cadastradas</span>'}
                                        </div>
                                    </td>
                                    <td class="px-4 py-3 text-right">
                                        <div class="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button onclick="toggleUserActive('${user.id}')" ${rowActionsBlocked ? 'disabled' : ''} title="${isUserActive(user) ? 'Inativar usuário' : 'Ativar usuário'}" class="p-1.5 ${isUserActive(user) ? 'text-amber-500 hover:text-amber-700' : 'text-emerald-500 hover:text-emerald-700'} hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                                                <i data-lucide="${isUserActive(user) ? 'user-x' : 'user-check'}" class="w-4 h-4"></i>
                                            </button>
                                            <button onclick="editUser('${user.id}')" ${rowActionsBlocked ? 'disabled' : ''} title="Editar usuário" class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                                                <i data-lucide="edit-2" class="w-4 h-4"></i>
                                            </button>
                                            <button onclick="deleteUser('${user.id}')" ${rowActionsBlocked ? 'disabled' : ''} title="Excluir usuário" class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="${isBulkSelectionMode ? '7' : '6'}" class="px-4 py-10 text-center text-slate-400">Nenhum usuário cadastrado ainda.</td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                    </div>
                    ${paginationMarkup}
                </div>
            </div>
            ${(hasQuickCategoryDrafts || isQuickCategorySaving) ? `
                <div class="fixed bottom-4 right-4 md:right-6 z-[70] w-[min(96vw,760px)] bg-amber-50/95 backdrop-blur border border-amber-200 rounded-2xl px-4 py-3 shadow-2xl flex items-center justify-between gap-3 flex-wrap">
                    <p class="text-sm font-bold text-amber-900">
                        ${isQuickCategorySaving
                            ? 'Salvando alterações de categorias...'
                            : `${formatCountLabel(draftStats.dirty, 'usuário com alteração pendente', 'usuários com alterações pendentes')} de categoria.`}
                    </p>
                    <div class="flex items-center gap-2">
                        <button
                            onclick="saveUserCategoryQuickChanges()"
                            ${(isQuickCategorySaving || !hasQuickCategoryDrafts) ? 'disabled' : ''}
                            class="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            ${isQuickCategorySaving ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                        <button
                            onclick="cancelUserCategoryQuickChanges()"
                            ${isQuickCategorySaving ? 'disabled' : ''}
                            class="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            Cancelar Alterações
                        </button>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

function renderCategoryDetail(container) {
    const category = getCurrentCategory();
    if (!category) {
        state.activeTab = 'categories';
        render();
        return;
    }

    const assignedUsers = state.users
        .filter((user) => isUserActive(user) && user.categoryIds.includes(category.id))
        .sort((a, b) => a.fullName.localeCompare(b.fullName));

    container.innerHTML = `
        <div class="space-y-6 ${state.currentViewAnimationClass}">
            <div class="flex items-start justify-between gap-4 flex-wrap">
                <div class="flex items-center gap-4">
                    <button onclick="switchTab('categories')" class="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                        <i data-lucide="arrow-left" class="w-6 h-6"></i>
                    </button>
                    <div>
                        <h2 class="text-2xl font-bold text-slate-100">${escapeHtml(category.name)}</h2>
                        <p class="text-xs text-slate-400 font-bold uppercase tracking-widest">Usuários vinculados à categoria</p>
                    </div>
                </div>
                <button onclick="switchTab('categories'); toggleCategoryModules('${category.id}')" class="px-4 py-2 rounded-xl text-sm font-bold bg-white border border-slate-200 hover:bg-slate-50">
                    Ver módulos da categoria
                </button>
            </div>
            <div class="grid grid-cols-1 gap-4">
                <div class="p-5 bg-white border border-slate-100 rounded-2xl">
                    <p class="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em]">Módulos</p>
                    <p class="mt-2 text-3xl font-black text-slate-800">${category.modules.length}</p>
                </div>
            </div>
            <div class="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                <p class="text-[11px] text-slate-500 font-black uppercase tracking-[0.2em]">Módulos cadastrados</p>
                ${category.modules.length ? `
                    <div class="mt-3 flex flex-wrap gap-2">
                        ${category.modules.map((module) => `
                            <span class="px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                ${escapeHtml(module.name)}
                            </span>
                        `).join('')}
                    </div>
                ` : `
                    <p class="mt-3 text-sm text-slate-400">Esta categoria ainda não possui módulos.</p>
                `}
            </div>
            <div class="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
                    <h3 class="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Usuários cadastrados na categoria</h3>
                    <button onclick="switchTab('users')" class="text-xs font-bold px-3 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200">
                        Ir para Usuários
                    </button>
                </div>
                ${assignedUsers.length ? `
                    <div class="lg:hidden p-4 space-y-3 bg-slate-50/60">
                        ${assignedUsers.map((user) => `
                            <article class="rounded-2xl border border-slate-200 bg-white p-3">
                                <p class="font-bold text-sm text-slate-800 truncate">${escapeHtml(user.fullName)}</p>
                                <p class="mt-0.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest">${escapeHtml(user.role)}</p>
                                <span class="inline-flex mt-2 px-2 py-1 rounded-md bg-slate-50 border border-slate-200 text-[10px] font-bold uppercase text-slate-500 break-all">
                                    ${escapeHtml(user.externalId)}
                                </span>
                            </article>
                        `).join('')}
                    </div>
                    <div class="hidden lg:block divide-y divide-slate-100">
                        ${assignedUsers.map((user) => `
                            <div class="px-6 py-4 flex items-center justify-between gap-3">
                                <div class="min-w-0">
                                    <p class="font-bold text-sm text-slate-800 truncate">${escapeHtml(user.fullName)}</p>
                                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">${escapeHtml(user.role)}</p>
                                </div>
                                <span class="px-2 py-1 rounded-md bg-slate-50 border border-slate-200 text-[10px] font-bold uppercase text-slate-500 shrink-0">
                                    ${escapeHtml(user.externalId)}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="p-10 text-center text-slate-400">
                        Nenhum usuário vinculado a esta categoria.
                    </div>
                `}
            </div>
            <div class="p-5 bg-white border border-slate-100 rounded-2xl">
                <p class="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em]">Usuários na categoria</p>
                <p class="mt-2 text-3xl font-black text-slate-800">${assignedUsers.length}</p>
            </div>
        </div>
    `;
}
