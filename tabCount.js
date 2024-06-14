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
        case 'tabs-rendered':
        case 'tree-attached':
        case 'tree-detached':
            updateTabCount();
    }
}

async function updateTabCount() {
    // run this for each window
    const messages = []
    for (const window of await browser.windows.getAll()) {
        let tabs = await browser.runtime.sendMessage(TST_ID, {
            type:   'get-light-tree',
            window:   window.id,
            tabs: '*',  // flatten tabs
        });
        messages.push({
            type:     'set-extra-contents',
            place:    'new-tab-button',
            contents: `<span id="tst-tab-count-${window.id}">${tabs.length} tabs</span>`,
            windowID:   window.id,
        })
        console.log(`setting tab count for window ${window.id} to ${tabs.length}`)
    }
    console.log(messages)
    browser.runtime.sendMessage(TST_ID, {messages: messages});
}


registerToTST();
updateTabCount();
browser.runtime.onMessageExternal.addListener(onMessageExternal)
