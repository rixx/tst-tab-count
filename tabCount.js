'use strict';

const TST_ID = 'treestyletab@piro.sakura.ne.jp';

async function registerToTST() {
    try {
        const result = await browser.runtime.sendMessage(TST_ID, {
            type: 'register-self',

            name:  browser.i18n.getMessage('tst-tabcount'),
            icons: browser.runtime.getManifest().icons,
            listeningTypes: [
                'sidebar-show',
                'new-tab-processed',
                'tabs-rendered',
                'tree-attached',
                'tree-detached',
            ],
            allowBulkMessaging: true,
            /* style "new tab" button: hide +, show text */
            style: `
            .newtab-button {
              height: 38px;
            }
            .newtab-button::after {
              display: none;
            }
            .newtab-button .extra-items-container {
              display: flex;
              justify-content: center;
              align-items: center;
            }
            `,
            permissions: [],
        });
    }
    catch(_error) {
    }
}

function onMessageExternal(message, sender) {
    if (!(message && sender.id === TST_ID)) return;
    if (message.messages) {
        for (const oneMessage of message.messages) {
            onMessageExternal(oneMessage, sender);
        }
    }
    switch (message.type) {
        case 'permissions-changed':
            registerToTST();
            break;
        case 'ready':
            registerToTST();
            updateTabCount();
            break;
        case 'sidebar-show':
        case 'new-tab-processed':
        case 'tabs-rendered':
        case 'tree-attached':
        case 'tree-detached':
            updateTabCount();
    }
}

async function updateTabCount() {
    // run this for each window
    const tabCounts = []
    for (const window of await browser.windows.getAll()) {
        let tabs = await browser.runtime.sendMessage(TST_ID, {
            type:   'get-light-tree',
            window:   window.id,
            tabs: '*',  // flatten tabs
        });
        tabCounts.push(tabs.length)
    }
    const totalTabs = tabCounts.reduce((a, b) => a + b, 0)
    const partialTabCount = tabCounts.join(' + ')
    browser.runtime.sendMessage(TST_ID, {
        type: 'set-extra-contents',
        place:    'new-tab-button',
        contents: `<span id="tst-tab-count-${window.id}">${totalTabs} tabs (${partialTabCount})</span>`,
    });
}


registerToTST();
updateTabCount();
browser.runtime.onMessageExternal.addListener(onMessageExternal)
browser.tabs.onCreated.addListener(updateTabCount)
browser.tabs.onRemoved.addListener(updateTabCount)
