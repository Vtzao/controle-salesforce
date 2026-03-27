(function bootstrapLegacyAppEntrypoint() {
    if (window.__ORGADATA_APP_BOOTSTRAPPED__) {
        return;
    }
    window.__ORGADATA_APP_BOOTSTRAPPED__ = true;

    const scripts = [
        './js/app/01-core.js',
        './js/app/02-rendering.js',
        './js/app/03-modals-users.js',
        './js/app/04-actions-init.js',
    ];

    let index = 0;
    const loadNext = () => {
        if (index >= scripts.length) {
            return;
        }

        const script = document.createElement('script');
        script.src = scripts[index];
        script.onload = () => {
            index += 1;
            loadNext();
        };
        script.onerror = () => {
            console.error('Falha ao carregar script da aplicação:', scripts[index]);
        };

        document.head.appendChild(script);
    };

    loadNext();
}());
