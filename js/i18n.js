const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};

const I18N = {
  ru: {
    'app.title': 'Easy Editor',
    'app.editorSuffix': '— редактор',
    'app.elements': 'Элементы',
    'app.elementsHint': 'Клик добавляет элемент внутрь выделенного.',
    'app.navigator': 'Навигатор',
    'app.properties': 'Стиль элемента',
    'app.preview': 'Просмотр',
    'app.edit': 'Редактор',
    'app.export': 'Экспорт HTML',
    'app.empty': 'Добавьте элементы из левой панели',
    'app.noSelection': 'Выберите элемент на канвасе или в навигаторе',
    'app.resetStyle': 'Сбросить стиль',
    'app.actions': 'Действия',
    'app.confirmDelete': 'Удалить элемент вместе с вложенными?',
    'app.exported': 'HTML скачан',

    'el.container': 'Контейнер',
    'el.section': 'Секция',
    'el.header': 'Шапка',
    'el.footer': 'Футер',
    'el.nav': 'Меню',
    'el.heading': 'Заголовок',
    'el.text': 'Текст',
    'el.link': 'Ссылка',
    'el.button': 'Кнопка',
    'el.image': 'Картинка',
    'el.list': 'Список',
    'el.listItem': 'Пункт списка',

    'sec.layout': 'Расположение',
    'sec.sizing': 'Размеры',
    'sec.spacing': 'Отступы',
    'sec.typography': 'Текст',
    'sec.appearance': 'Внешний вид',

    'st.display': 'Display',
    'st.flexDirection': 'Направление',
    'st.justifyContent': 'По горизонтали',
    'st.alignItems': 'По вертикали',
    'st.gap': 'Промежуток',
    'st.width': 'Ширина',
    'st.height': 'Высота',
    'st.padding': 'Внутренние',
    'st.margin': 'Внешние',
    'st.fontSize': 'Размер шрифта',
    'st.fontWeight': 'Насыщенность',
    'st.textAlign': 'Выравнивание',
    'st.color': 'Цвет текста',
    'st.background': 'Фон',
    'st.borderRadius': 'Скругление',
    'st.opacity': 'Прозрачность',
    'st.text': 'Текст',
    'st.href': 'Ссылка (href)',
    'st.src': 'Адрес картинки (src)',
    'st.alt': 'Описание (alt)',

    'opt.auto': 'Авто',
    'opt.row': 'Ряд',
    'opt.column': 'Столбец',
    'opt.start': 'Начало',
    'opt.center': 'Центр',
    'opt.end': 'Конец',
    'opt.spaceBetween': 'Между',
    'opt.left': 'По левому краю',
    'opt.right': 'По правому краю',
    'opt.normal': 'Обычная',
    'opt.bold': 'Жирная',

    'act.up': 'Выше',
    'act.down': 'Ниже',
    'act.dup': 'Дублировать',
    'act.del': 'Удалить',

    'tpl.heroTitle': 'Дизайнер и фронтенд-разработчик',
    'tpl.heroSubtitle': 'Создаю адаптивные сайты, где технологии встречаются с креативом.',
    'tpl.heroButton': 'Связаться',
    'tpl.footer': '© 2025 · Сделано в Easy Editor',

    'title.undo': 'Отменить (Ctrl+Z)',
    'title.redo': 'Вернуть (Ctrl+Shift+Z)',
    'title.export': 'Скачать самодостаточный HTML',
    'title.preview': 'Режим просмотра',
  },
  en: {
    'app.title': 'Easy Editor',
    'app.editorSuffix': '— editor',
    'app.elements': 'Elements',
    'app.elementsHint': 'Click adds an element inside the selected one.',
    'app.navigator': 'Navigator',
    'app.properties': 'Element style',
    'app.preview': 'Preview',
    'app.edit': 'Editor',
    'app.export': 'Export HTML',
    'app.empty': 'Add elements from the left panel',
    'app.noSelection': 'Select an element on the canvas or in the navigator',
    'app.resetStyle': 'Reset style',
    'app.actions': 'Actions',
    'app.confirmDelete': 'Delete this element and its children?',
    'app.exported': 'HTML downloaded',

    'el.container': 'Container',
    'el.section': 'Section',
    'el.header': 'Header',
    'el.footer': 'Footer',
    'el.nav': 'Nav menu',
    'el.heading': 'Heading',
    'el.text': 'Text',
    'el.link': 'Link',
    'el.button': 'Button',
    'el.image': 'Image',
    'el.list': 'List',
    'el.listItem': 'List item',

    'sec.layout': 'Layout',
    'sec.sizing': 'Sizing',
    'sec.spacing': 'Spacing',
    'sec.typography': 'Typography',
    'sec.appearance': 'Appearance',

    'st.display': 'Display',
    'st.flexDirection': 'Direction',
    'st.justifyContent': 'Justify',
    'st.alignItems': 'Align',
    'st.gap': 'Gap',
    'st.width': 'Width',
    'st.height': 'Height',
    'st.padding': 'Padding',
    'st.margin': 'Margin',
    'st.fontSize': 'Font size',
    'st.fontWeight': 'Weight',
    'st.textAlign': 'Text align',
    'st.color': 'Text color',
    'st.background': 'Background',
    'st.borderRadius': 'Radius',
    'st.opacity': 'Opacity',
    'st.text': 'Text',
    'st.href': 'Link (href)',
    'st.src': 'Image source (src)',
    'st.alt': 'Alt text',

    'opt.auto': 'Auto',
    'opt.row': 'Row',
    'opt.column': 'Column',
    'opt.start': 'Start',
    'opt.center': 'Center',
    'opt.end': 'End',
    'opt.spaceBetween': 'Space between',
    'opt.left': 'Left',
    'opt.right': 'Right',
    'opt.normal': 'Normal',
    'opt.bold': 'Bold',

    'act.up': 'Move up',
    'act.down': 'Move down',
    'act.dup': 'Duplicate',
    'act.del': 'Delete',

    'tpl.heroTitle': 'Web designer and front-end developer',
    'tpl.heroSubtitle': 'I craft responsive websites where technologies meet creativity.',
    'tpl.heroButton': 'Contact me',
    'tpl.footer': '© 2025 · Made with Easy Editor',

    'title.undo': 'Undo (Ctrl+Z)',
    'title.redo': 'Redo (Ctrl+Shift+Z)',
    'title.export': 'Download self-contained HTML',
    'title.preview': 'Preview mode',
  },
};

let LANG = store.get('easy-editor:lang') || 'ru';
if (!I18N[LANG]) LANG = 'ru';

function t(key, vars) {
  let s = (I18N[LANG] && I18N[LANG][key]) ?? I18N.ru[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll('{' + k + '}', v);
  return s;
}

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  document.documentElement.lang = LANG;
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === LANG));
}

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    LANG = btn.dataset.lang;
    store.set('easy-editor:lang', LANG);
    applyI18n();
    document.dispatchEvent(new Event('langchange'));
  });
});
