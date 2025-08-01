(() => {
  if (typeof window.jQuery === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://code.jquery.com/jquery-3.7.1.min.js';
    script.onload = () => {
      mainUserListApp();
    };
    document.head.appendChild(script);
  } else {
    mainUserListApp();
  }
})();

const mainUserListApp = () => {
  (($) => {
    'use strict';

    const APPEND_LOCATION = '.ins-api-users';

    const classes = {
      style: 'userlist-style',
      container: 'container',
      title: 'title',
      userList: 'user-list',
      userCard: 'user-card',
      cardHeader: 'card-header',
      cardBody: 'card-body',
      cardMainInfo: 'card-main-info',
      cardAdress: 'card-address',
      cardFooter: 'card-footer',
      deleteBtn: 'delete-btn',
      errorMsg: 'userlist-error-message',
      reloadBtn: 'reload-btn',
    };

    const selectors = {
      appendLocation: APPEND_LOCATION,
      style: `.${classes.style}`,
      container: `.${classes.container}`,
      title: `.${classes.title}`,
      userList: `.${classes.userList}`,
      userCard: `.${classes.userCard}`,
      cardHeader: `.${classes.cardHeader}`,
      cardBody: `.${classes.cardBody},`,
      cardMainInfo: `.${classes.cardMainInfo}`,
      cardAdress: `.${classes.cardAdress}`,
      cardFooter: `.${classes.cardFooter}`,
      deleteBtn: `.${classes.deleteBtn}`,
      errorMsg: `.${classes.errorMsg}`,
      reloadBtn: `.${classes.reloadBtn}`,
    };

    const API_URL = 'https://jsonplaceholder.typicode.com/users';
    const STORAGE_KEY = 'userListData';
    const CACHE_DURATION = 24 * 60 * 60 * 1000;

    const self = {};

    self.init = () => {
      self.reset();
      self.buildCSS();
      self.buildHTML();
      self.checkAndLoadData();
      self.setEvents();
      self.observeUserList();
    };

    self.reset = () => {
      $(selectors.style).remove();
      $(selectors.container).remove();
      $(document).off('.userDeleteEvent');
      $(document).off('.reloadBtnEvent');

      if (self.userObserver) {
        self.userObserver.disconnect();
        self.userObserver = null;
      }
    };

    self.buildCSS = () => {
      const customStyle = `
      <style class="${classes.style}">

        *{
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        ${selectors.appendLocation} {
          font-family: 'Segoe UI', Arial, sans-serif;
        }

        ${selectors.container} {
          max-width: 1000px;
          margin: 40px auto;
          padding: 36px 28px;
        }

        ${selectors.title} {
          text-align: center;
          margin-bottom: 28px;
          color: #222;
          font-size: 2.1em;
          letter-spacing: 1px;
        }

        ${selectors.userList} {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 18px;
        }
        @media (max-width: 1100px) {
          ${selectors.userList} {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 800px) {
          ${selectors.userList} {
            grid-template-columns: 1fr;
          }
        }
        .${classes.userCard} {
          background: #f8f8f8;
          border-radius: 10px;
          box-shadow: 0 1px 6px rgba(0,0,0,0.04);
          padding: 20px 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: box-shadow 0.2s;
        }

        .${classes.userCard}:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,0.10);
        }

        .${classes.cardHeader} h2 {
          font-size: 1.3em;
          color: #333;
        }

        .${classes.cardBody} {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 1em;
        }

        .${classes.cardMainInfo} p {
          margin: 0 0 2px 0;
          color: #444;
          font-weight: 500;
        }

        .${classes.cardAdress} p {
          margin: 0 0 2px 0;
          color: #888;
          font-size: 0.97em;
        }

        .${classes.cardFooter} {
          display: flex;
          justify-content: center;
          margin-top: 10px;
        }

        .${classes.deleteBtn} {
          background: #e74c3c;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 8px 18px;
          cursor: pointer;
          font-size: 1em;
          font-weight: 500;
          transition: background 0.2s;
          min-width: 100px;
          margin: 0 auto;
        }

        .${classes.deleteBtn}:hover {
          background: #c0392b;
        }

        ${selectors.errorMsg} {
          background: #ffeaea;
          color: #c0392b;
          padding: 16px 24px;
          border-radius: 10px;
          text-align: center;
          border: 1.5px solid #e74c3c;
          position: fixed;
          right: 32px;
          bottom: 32px;
          z-index: 9999;
          min-width: 260px;
          max-width: 90vw;
          box-shadow: 0 2px 16px rgba(0,0,0,0.10);
        }

        .${classes.reloadBtn} {
          background: #3498db;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 12px 28px;
          cursor: pointer;
          font-size: 1.1em;
          font-weight: 600;
          margin: 32px auto 0 auto;
          display: block;
          box-shadow: 0 2px 8px rgba(52,152,219,0.10);
          transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
          letter-spacing: 0.5px;
        }
        .${classes.reloadBtn}:hover {
          background: #217dbb;
          box-shadow: 0 4px 16px rgba(52,152,219,0.18);
          transform: translateY(-2px) scale(1.03);
        }

        @media (max-width: 600px) {
          ${selectors.container} {
            padding: 40px;
          }
          .${classes.userCard} {
            padding: 15px;
          }
        }

      </style>`;
      $('head').append(customStyle);
    };

    self.buildHTML = () => {
      const html = `
        <div class="${classes.container}">
            <h1 class="${classes.title}">User List</h1>
        </div>
      `;
      $(selectors.appendLocation).prepend(html);
    };

    self.setEvents = () => {
      $(document).on(`click.userDeleteEvent`, selectors.deleteBtn, function () {
        const $id = Number($(this).data('id'));
        self.deleteUser($id);
      });

      $(document).on(`click.reloadBtnEvent`, selectors.reloadBtn, function () {
        sessionStorage.setItem('isUsersReloaded', 'true');
        localStorage.removeItem('userListData');
        $(this).remove();
        self.checkAndLoadData();
      });
    };

    self.showError = (message) => {
      $(selectors.errorMsg).remove();

      const $error = $(`<div class="${classes.errorMsg}">${message}</div>`);

      $(selectors.appendLocation).append($error);
    };

    self.checkAndLoadData = () => {
      $(selectors.errorMsg).remove();

      let users = self.getFromStorage();
      if (users) {
        self.renderList(users);
      } else {
        fetch(API_URL)
          .then((respond) => {
            if (!respond.ok) throw new Error('API respond failed');
            return respond.json();
          })
          .then((data) => {
            self.saveToStorage(data);
            self.renderList(data);
          })
          .catch((err) => {
            console.error('api error: ', err);
            self.showError(
              'User data could not be retrieved. Please try again later.'
            );
          });
      }
    };

    self.renderList = (users) => {
      const $container = $(selectors.container);
      let $userList = $(selectors.userList);

      if ($userList.length) {
        $userList.empty();
      } else {
        $userList = $(`<div class="${classes.userList}"></div>`);
        $container.append($userList);
      }

      $.each(users, function (index, user) {
        const $card = $(`<div class=${classes.userCard}></div>`);

        const $cardHeader = $(`<div class=${classes.cardHeader}></div>`);
        const $h2 = $(`<h2>${user.name}</h2>`);
        $cardHeader.append($h2);
        $card.append($cardHeader);

        const $cardBody = $(`<div class=${classes.cardBody}>`);

        const $cardMainInfo = $(`<div class=${classes.cardMainInfo}>`);
        $cardMainInfo.append(
          `<p><strong>Username:</strong> ${user.username}</p>`
        );
        $cardMainInfo.append(`<p><strong>Email:</strong> ${user.email}</p>`);
        $cardBody.append($cardMainInfo);

        const $cardAddress = $(`<div class=${classes.cardAdress}>`);
        $cardAddress.append(
          `<p><strong>Address:</strong> ${user.address.city}, ${user.address.street}, ${user.address.suite}, ${user.address.zipcode}</p>`
        );
        $cardBody.append($cardAddress);

        $card.append($cardBody);

        const $cardFooter = $(`<div class=${classes.cardFooter}></div>`);
        $cardFooter.append(
          `<button class="${classes.deleteBtn}" data-id="${user.id}">Delete</button>`
        );
        $card.append($cardFooter);

        $userList.append($card);
      });
    };

    self.deleteUser = (id) => {
      let $users = self.getFromStorage();

      if (!$users) {
        self.showError('No user data found. Reloading...');
        setTimeout(() => {
          return self.checkAndLoadData();
        }, 2000);
      }

      $users = $users.filter((item) => item.id !== id);

      self.saveToStorage($users);
      self.renderList($users);
    };

    self.saveToStorage = (data) => {
      const toStore = {
        users: data,
        exp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    };

    self.getFromStorage = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      try {
        const parsed = JSON.parse(stored);

        if (!parsed.exp || !parsed.users) return null;
        if (Date.now() - parsed.exp > CACHE_DURATION) {
          localStorage.removeItem(STORAGE_KEY);
          return null;
        }

        return parsed.users;
      } catch (err) {
        console.error('localStorage parse error:', err);
        self.showError(
          'Saved data could not be read. Please refresh the page.'
        );
        return null;
      }
    };

    self.observeUserList = () => {
      setTimeout(() => {
        const containerNode = document.querySelector(selectors.container);

        if (!containerNode) return;

        if (self.userObserver) self.userObserver.disconnect();

        self.userObserver = new MutationObserver(() => {
          if (
            !sessionStorage.getItem('isUsersReloaded') &&
            $(selectors.userCard).length === 0
          ) {
            self.showReloadBtn();
          }
        });

        self.userObserver.observe(containerNode, {
          childList: true,
          subtree: true,
        });
      }, 100);
    };

    self.showReloadBtn = () => {
      if ($(selectors.reloadBtn).length) return;

      const $btn = $(
        `<button class=${classes.reloadBtn}>Reload Users</button>`
      );

      const $container = $(selectors.container);

      $container.append($btn);
    };

    $(document).ready(self.init);
  })(jQuery);
};
