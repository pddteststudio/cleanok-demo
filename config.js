/* CleanOK — editable demo data. All amounts are unverified public listing references. */
window.CLEANOK_CONFIG = Object.freeze({
  business: {
    name: 'CleanOK',
    location: 'Челябинск',
    phoneDisplay: '+7 (932) 015-10-50',
    phoneLink: '+79320151050',
    mapUrl: 'https://yandex.com/maps/org/cleanok/54023326045/',
    vkUrl: 'https://vk.com/cleanok_74',
    telegramUrl: 'https://t.me/cleanok_74',
    developerTelegramUrl: 'https://t.me/milmak11'
  },
  demoMode: true,
  liveLeadsEnabled: false,
  referenceDate: 'ноябрь 2026',
  prices: [
    { id:'sofa-bed', name:'Спальное место дивана', price:1500, unit:'за позицию в публикации', calculable:true, note:'Ориентир из объявления, не подтверждённый тариф.' },
    { id:'armchair', name:'Текстильное кресло', price:500, unit:'за позицию в публикации', calculable:true, note:'Ориентир из объявления, не подтверждённый тариф.' },
    { id:'sofa', name:'Химчистка мягкой мебели', price:3500, unit:'единица расчёта не уточнена', calculable:false, note:'Общий ориентир. Не используется для умножения на предметы.' },
    { id:'window', name:'Мойка окон и рам', price:1000, unit:'объём работ не уточнён', calculable:false, note:'Общий ориентир. Итог зависит от количества окон.' },
    { id:'carpet', name:'Чистка ковролина', price:375, unit:'единица расчёта не уточнена', calculable:false, note:'Нельзя умножать на площадь без подтверждения единицы тарифа.' },
    { id:'mattress', name:'Чистка матраса', price:null, unit:'по согласованию', calculable:false, note:'Стоимость не опубликована в подтверждённом прайсе.' },
    { id:'chair', name:'Чистка стульев', price:null, unit:'по согласованию', calculable:false, note:'Стоимость уточняется индивидуально.' }
  ]
});
