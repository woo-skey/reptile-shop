import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const parseEnvFile = (filePath) => {
  const raw = fs.readFileSync(filePath, 'utf8')
  return raw
    .split(/\r?\n/)
    .filter((line) => line && !line.trim().startsWith('#'))
    .reduce((acc, line) => {
      const idx = line.indexOf('=')
      if (idx <= 0) return acc
      const key = line.slice(0, idx).trim()
      const value = line.slice(idx + 1).trim()
      acc[key] = value
      return acc
    }, {})
}

const normalizeName = (value) => value
  .toLowerCase()
  .replace(/[^0-9a-z가-힣]/gi, '')

const item = ({
  category,
  name,
  description,
  note = null,
  subcategory = null,
  abv = null,
  volume_ml = null,
  price = null,
  price_glass = null,
  price_bottle = null,
  sort_order = 0,
}) => ({
  category,
  name,
  description,
  note,
  subcategory,
  abv,
  volume_ml,
  price,
  price_glass,
  price_bottle,
  sort_order,
  is_available: true,
})

const MENU_ITEMS = [
  item({ category: 'signature', name: 'HP포션(장미)', description: 'HP Potion (Rose)', abv: 15, price: 11900, sort_order: 10 }),
  item({ category: 'signature', name: 'MP포션(페퍼민트)', description: 'MP Potion (Peppermint)', abv: 15, price: 11900, sort_order: 20 }),
  item({ category: 'signature', name: 'SP포션(야관문)', description: 'SP Potion (Lespedeza cuneata)', abv: 15, price: 11900, sort_order: 30 }),
  item({ category: 'signature', name: '포션 토닉 세트', description: 'Potion + Tonic Set', price: 19900, sort_order: 40 }),
  item({ category: 'signature', name: '해리포터 버터비어', description: 'Harry Potter Butter Beer', abv: 4, price: 9900, sort_order: 50 }),

  item({ category: 'non_alcohol', name: '레몬에이드', description: 'Lemonade', price: 9900, sort_order: 10 }),

  item({ category: 'beverage', name: '코카콜라', description: 'Coke', note: '바틀 주문 시 2,900원', price: 4900, sort_order: 10 }),
  item({ category: 'beverage', name: '스프라이트', description: 'Sprite', note: '바틀 주문 시 2,900원', price: 4900, sort_order: 20 }),
  item({ category: 'beverage', name: '토닉워터', description: 'Tonic Water', note: '바틀 주문 시 2,900원', price: 4900, sort_order: 30 }),
  item({ category: 'beverage', name: '진저에일', description: 'Ginger Ale', note: '바틀 주문 시 2,900원', price: 4900, sort_order: 40 }),
  item({ category: 'beverage', name: '클럽소다', description: 'Club Soda', note: '바틀 주문 시 2,900원', price: 4900, sort_order: 50 }),
  item({ category: 'beverage', name: '핫식스', description: 'Hot6', note: '바틀 주문 시 2,900원', price: 4900, sort_order: 60 }),

  item({ category: 'cocktail', subcategory: '7900', name: '스크루 드라이버', description: 'Screw Driver', abv: 13, sort_order: 110 }),
  item({ category: 'cocktail', subcategory: '7900', name: '진토닉', description: 'Gin & Tonic', abv: 13, sort_order: 120 }),
  item({ category: 'cocktail', subcategory: '7900', name: '럼콕', description: 'Rum & Coke', abv: 13, sort_order: 130 }),
  item({ category: 'cocktail', subcategory: '8900', name: '깔루아 밀크', description: 'Kahlua Milk', abv: 6.6, sort_order: 210 }),
  item({ category: 'cocktail', subcategory: '8900', name: '화이트 러시안', description: 'White Russian', abv: 19, sort_order: 220 }),
  item({ category: 'cocktail', subcategory: '8900', name: '말리부 오렌지', description: 'Malibu Orange', abv: 7, sort_order: 230 }),
  item({ category: 'cocktail', subcategory: '8900', name: '미도리 사워', description: 'Midori Sour', abv: 6.6, sort_order: 240 }),
  item({ category: 'cocktail', subcategory: '8900', name: '테킬라 선라이즈', description: 'Tequila Sunrise', abv: 12, sort_order: 250 }),
  item({ category: 'cocktail', subcategory: '9900', name: '롱 아일랜드 아이스티', description: 'Long Island Iced Tea', abv: 25, sort_order: 310 }),
  item({ category: 'cocktail', subcategory: '9900', name: '아디오스 마더퍼커', description: 'Adios Motherfucker', abv: 25, sort_order: 320 }),
  item({ category: 'cocktail', subcategory: '9900', name: '피치 크러시', description: 'Peach Crush', abv: 6.6, sort_order: 330 }),
  item({ category: 'cocktail', subcategory: '9900', name: '준벅', description: 'June Bug', abv: 7, sort_order: 340 }),
  item({ category: 'cocktail', subcategory: '9900', name: '섹스 온 더 비치', description: 'Sex on the Beach', abv: 14, sort_order: 350 }),
  item({ category: 'cocktail', subcategory: '11900', name: '베일리스 밀크', description: 'Baileys Milk', abv: 5.6, sort_order: 410 }),
  item({ category: 'cocktail', subcategory: '11900', name: '프란젤리코 밀크', description: 'Frangelico Milk', abv: 6.6, sort_order: 420 }),
  item({ category: 'cocktail', subcategory: '11900', name: '예거 밤', description: 'Jagerbomb', abv: 11.6, sort_order: 430 }),
  item({ category: 'cocktail', subcategory: '14900', name: '아그와 밤', description: 'Agwa Bomb', abv: 10, sort_order: 510 }),
  item({ category: 'cocktail', subcategory: '14900', name: '엑스레이티드 토닉', description: 'X-rated Tonic', abv: 5.6, sort_order: 520 }),
  item({ category: 'cocktail', subcategory: '14900', name: '잭콕', description: 'Jack & Coke', abv: 13, sort_order: 530 }),

  item({ category: 'food', name: '간장 새우', description: 'Soy-marinated Shrimp', price: 17900, sort_order: 10 }),
  item({ category: 'food', name: '양송이 우삼겹 크림 리조또', description: 'Mushroom & Beef Loin Cream Risotto', price: 17900, sort_order: 20 }),
  item({ category: 'food', name: '쭈꾸미 바지락 먹물 파스타', description: 'Webfoot Octopus, Manila Clam, Ink Pasta', note: '바게트 추가 +2,900원', price: 17900, sort_order: 30 }),
  item({ category: 'food', name: '에그인헬', description: 'Egg in Hell', note: '바게트 추가 +2,900원', price: 17900, sort_order: 40 }),
  item({ category: 'food', name: '맥앤치즈', description: 'Mac & Cheese', price: 17900, sort_order: 50 }),
  item({ category: 'food', name: '감바스 알 아히요', description: 'Gambas al Ajillo', note: '바게트 추가 +2,900원', price: 17900, sort_order: 60 }),
  item({ category: 'food', name: '새우 오일 파스타', description: 'Shrimp Oil Pasta', note: '바게트 추가 +2,900원', price: 17900, sort_order: 70 }),
  item({ category: 'food', name: '치킨 윙&봉&감자튀김', description: 'Chicken Wing & Chips', price: 17900, sort_order: 80 }),
  item({ category: 'food', name: '킬바사 소시지 & 감자튀김', description: 'Kielbasa & Chips', price: 16900, sort_order: 90 }),
  item({ category: 'food', name: '멜론 하몽', description: 'Melon con Jamon', price: 16900, sort_order: 100 }),
  item({ category: 'food', name: '명란젓 구이', description: 'Grilled Salted Pollock Roe', price: 11900, sort_order: 110 }),
  item({ category: 'food', name: '트러플 감자튀김', description: 'Truffle Chips', price: 9900, sort_order: 120 }),

  item({ category: 'beer', name: '런던 프라이드', description: 'London Pride (UK)', abv: 4.7, volume_ml: 330, price: 9900, sort_order: 10 }),
  item({ category: 'beer', name: '에스트렐라 담 바르셀로나', description: 'Estrella Damm Barcelona (Spain)', abv: 4.6, volume_ml: 330, price: 9900, sort_order: 20 }),
  item({ category: 'beer', name: '1664 블랑', description: '1664 Blanc (Poland)', abv: 5, volume_ml: 330, price: 9900, sort_order: 30 }),
  item({ category: 'beer', name: '코로나', description: 'Corona Extra (Mexico)', abv: 4.5, volume_ml: 335, price: 8900, sort_order: 40 }),
  item({ category: 'beer', name: '호가든', description: 'Hoegaarden (Belgium)', abv: 4.9, volume_ml: 330, price: 7900, sort_order: 50 }),
  item({ category: 'beer', name: '버드와이저', description: 'Budweiser (U.S.A)', abv: 5, volume_ml: 330, price: 5900, sort_order: 60 }),

  item({ category: 'wine', subcategory: 'red', name: '돈시몬 셀렉션 템프라니요', description: 'Don Simon Seleccion Tempranillo (Spain, 750ml)', abv: 12, volume_ml: 750, price_bottle: 29900, sort_order: 10 }),
  item({ category: 'wine', subcategory: 'red', name: '몽그라스 아우라 멜롯', description: 'Montgras AURA Merlot (Chile, 750ml)', abv: 13, volume_ml: 750, price_bottle: 39900, sort_order: 20 }),
  item({ category: 'wine', subcategory: 'red', name: '몽그라스 아우라 까베르네 소비뇽', description: 'Montgras AURA Cabernet Sauvignon (Chile, 750ml)', abv: 13, volume_ml: 750, price_bottle: 39900, sort_order: 30 }),
  item({ category: 'wine', subcategory: 'red', name: '뀌베 디세네 피노누아', description: 'Cuvee Dissenay Pinot Noir (France, 750ml)', abv: 13, volume_ml: 750, price_bottle: 59900, sort_order: 40 }),
  item({ category: 'wine', subcategory: 'white', name: '몽그라스 아우라 샤도네이', description: 'Montgras AURA Chardonnay (Chile, 750ml)', abv: 12.5, volume_ml: 750, price_bottle: 39900, sort_order: 110 }),
  item({ category: 'wine', subcategory: 'white', name: '군트럼 리슬링', description: 'Guntrum Riesling (Germany, 750ml)', abv: 9.5, volume_ml: 750, price_bottle: 59900, sort_order: 120 }),
  item({ category: 'wine', subcategory: 'white', name: '미쉘 린치 보르도 소비뇽 블랑', description: 'Michel Lynch Bordeaux Sauvignon Blanc (France, 750ml)', abv: 12.5, volume_ml: 750, price_bottle: 89900, sort_order: 130 }),
  item({ category: 'wine', subcategory: 'sparkling', name: '본샹스 모스카토', description: 'Bonne Chance Moscato (Spain, 750ml)', abv: 7, volume_ml: 750, price_bottle: 49900, sort_order: 210 }),
  item({ category: 'wine', subcategory: 'sparkling', name: '하우메 세라 브뤼 까바', description: 'Jaume Serra Brut Cava (Spain, 750ml)', abv: 11.5, volume_ml: 750, price_bottle: 49900, sort_order: 220 }),

  item({ category: 'whisky', subcategory: 'blended', name: '제임슨', description: 'Jameson (Irish, 700ml)', abv: 40, volume_ml: 700, price_glass: 5900, price_bottle: 119900, sort_order: 10 }),
  item({ category: 'whisky', subcategory: 'blended', name: '몽키 숄더', description: 'Monkey Shoulder (Scotland, 700ml)', abv: 40, volume_ml: 700, price_glass: 7900, price_bottle: 159900, sort_order: 20 }),
  item({ category: 'whisky', subcategory: 'blended', name: '조니워커 더블 블랙', description: 'Johnnie Walker Double Black (Scotland, 700ml)', abv: 40, volume_ml: 700, price_glass: 8900, price_bottle: 189900, sort_order: 30 }),

  item({ category: 'whisky', subcategory: 'single_malt', name: '탈리스커 10Y', description: 'Talisker 10Y (Scotland, 700ml)', abv: 45.8, volume_ml: 700, price_glass: 11900, price_bottle: 259900, sort_order: 110 }),
  item({ category: 'whisky', subcategory: 'single_malt', name: '아드벡 10Y', description: 'Ardbeg 10Y (Scotland, 700ml)', abv: 46, volume_ml: 700, price_glass: 14900, price_bottle: 319900, sort_order: 120 }),
  item({ category: 'whisky', subcategory: 'single_malt', name: '아드벡 우거다일', description: 'Ardbeg Uigeadail (Scotland, 700ml)', abv: 54.2, volume_ml: 700, price_glass: 20900, price_bottle: 479900, sort_order: 130 }),
  item({ category: 'whisky', subcategory: 'single_malt', name: '달모어 12Y', description: 'Dalmore 12Y (Scotland, 700ml)', abv: 40, volume_ml: 700, price_glass: 15900, price_bottle: 349900, sort_order: 140 }),
  item({ category: 'whisky', subcategory: 'single_malt', name: '라가불린 8Y', description: 'Lagavulin 8Y (Scotland, 700ml)', abv: 48, volume_ml: 700, price_glass: 15900, price_bottle: 349900, sort_order: 150 }),
  item({ category: 'whisky', subcategory: 'single_malt', name: '라가불린 16Y', description: 'Lagavulin 16Y (Scotland, 700ml)', abv: 43, volume_ml: 700, price_glass: 22900, price_bottle: 519900, sort_order: 160 }),
  item({ category: 'whisky', subcategory: 'single_malt', name: '발베니 12Y 더블우드', description: 'Balvenie 12Y DoubleWood (Scotland, 700ml)', abv: 40, volume_ml: 700, price_glass: 14900, price_bottle: 329900, sort_order: 170 }),
  item({ category: 'whisky', subcategory: 'single_malt', name: '발베니 14Y 캐리비안캐스크', description: 'Balvenie 14Y Caribbean Cask (Scotland, 700ml)', abv: 43, volume_ml: 700, price_glass: 22900, price_bottle: 499900, sort_order: 180 }),
  item({ category: 'whisky', subcategory: 'single_malt', name: '발베니 16Y 프렌치오크', description: 'Balvenie 16Y French Oak (Scotland, 700ml)', abv: 47.6, volume_ml: 700, price_glass: 35900, price_bottle: 799900, sort_order: 190 }),
  item({ category: 'whisky', subcategory: 'single_malt', name: '글렌모렌지 12Y 디 오리지널', description: 'Glenmorangie 12Y The Original (Scotland, 700ml)', abv: 40, volume_ml: 700, price_glass: 11900, price_bottle: 269900, sort_order: 200 }),
  item({ category: 'whisky', subcategory: 'single_malt', name: '글렌모렌지 14Y 퀸타루반', description: 'Glenmorangie 14Y Quinta Ruban (Scotland, 700ml)', abv: 46, volume_ml: 700, price_glass: 15900, price_bottle: 359900, sort_order: 210 }),
  item({ category: 'whisky', subcategory: 'single_malt', name: '글렌모렌지 15Y 라산타', description: 'Glenmorangie 15Y The Lasanta (Scotland, 700ml)', abv: 43, volume_ml: 700, price_glass: 18900, price_bottle: 419900, sort_order: 220 }),
  item({ category: 'whisky', subcategory: 'single_malt', name: '글렌모렌지 넥타 도르', description: "Glenmorangie Nectar d'Or (Scotland, 700ml)", abv: 46, volume_ml: 700, price_glass: 17900, price_bottle: 389900, sort_order: 230 }),
  item({ category: 'whisky', subcategory: 'single_malt', name: '글렌모렌지 시그넷', description: 'Glenmorangie Signet (Scotland, 700ml)', abv: 46, volume_ml: 700, price_glass: 37900, price_bottle: 849900, sort_order: 240 }),
  item({ category: 'whisky', subcategory: 'single_malt', name: '글렌알라키 8Y', description: 'GlenAllachie 8Y (Scotland, 700ml)', abv: 46, volume_ml: 700, price_glass: 13900, price_bottle: 299900, sort_order: 250 }),
  item({ category: 'whisky', subcategory: 'single_malt', name: '글렌알라키 10Y', description: 'GlenAllachie 10Y (Scotland, 700ml)', abv: 59.4, volume_ml: 700, price_glass: 22900, price_bottle: 519900, sort_order: 260 }),
  item({ category: 'whisky', subcategory: 'single_malt', name: '글렌알라키 12Y', description: 'GlenAllachie 12Y (Scotland, 700ml)', abv: 46, volume_ml: 700, price_glass: 17900, price_bottle: 399900, sort_order: 270 }),
  item({ category: 'whisky', subcategory: 'single_malt', name: '글렌알라키 15Y', description: 'GlenAllachie 15Y (Scotland, 700ml)', abv: 46, volume_ml: 700, price_glass: 27900, price_bottle: 629900, sort_order: 280 }),
  item({ category: 'whisky', subcategory: 'single_malt', name: '더 글렌리벳 12Y', description: 'The Glenlivet 12Y (Scotland, 700ml)', abv: 40, volume_ml: 700, price_glass: 14900, price_bottle: 319900, sort_order: 290 }),
  item({ category: 'whisky', subcategory: 'single_malt', name: '더 글렌리벳 15Y', description: 'The Glenlivet 15Y (Scotland, 700ml)', abv: 40, volume_ml: 700, price_glass: 19900, price_bottle: 439900, sort_order: 300 }),
  item({ category: 'whisky', subcategory: 'single_malt', name: '카발란 디스틸러리 셀렉트', description: 'Kavalan Distillery Select (Taiwan, 700ml)', abv: 40, volume_ml: 700, price_glass: 13900, price_bottle: 299900, sort_order: 310 }),

  item({ category: 'whisky', subcategory: 'bourbon', name: '와일드터키 81', description: 'Wild Turkey 81 (U.S.A, 750ml)', abv: 40.5, volume_ml: 750, price_glass: 6900, price_bottle: 159900, sort_order: 410 }),
  item({ category: 'whisky', subcategory: 'bourbon', name: '와일드터키 101 8Y', description: 'Wild Turkey 101 8Y (U.S.A, 700ml)', abv: 50.5, volume_ml: 700, price_glass: 7900, price_bottle: 179900, sort_order: 420 }),
  item({ category: 'whisky', subcategory: 'bourbon', name: '버팔로 트레이스', description: 'Buffalo Trace (U.S.A, 750ml)', abv: 45, volume_ml: 750, price_glass: 6900, price_bottle: 159900, sort_order: 430 }),
  item({ category: 'whisky', subcategory: 'bourbon', name: '메이커스 마크', description: "Maker's Mark (U.S.A, 750ml)", abv: 45, volume_ml: 750, price_glass: 6900, price_bottle: 169900, sort_order: 440 }),
  item({ category: 'whisky', subcategory: 'bourbon', name: '놉 크릭', description: 'Knob Creek (U.S.A, 750ml)', abv: 50, volume_ml: 750, price_glass: 8900, price_bottle: 209900, sort_order: 450 }),
  item({ category: 'whisky', subcategory: 'bourbon', name: '1792 스몰 배치', description: '1792 Small Batch (U.S.A, 750ml)', abv: 46.85, volume_ml: 750, price_glass: 9900, price_bottle: 229900, sort_order: 460 }),
  item({ category: 'whisky', subcategory: 'bourbon', name: '우드포드 리저브', description: 'Woodford Reserve (U.S.A, 750ml)', abv: 43.2, volume_ml: 750, price_glass: 9900, price_bottle: 239900, sort_order: 470 }),
  item({ category: 'whisky', subcategory: 'bourbon', name: '포 로지스 싱글배럴', description: 'Four Roses Single Barrel (U.S.A, 750ml)', abv: 50, volume_ml: 750, price_glass: 11900, price_bottle: 289900, sort_order: 480 }),
  item({ category: 'whisky', subcategory: 'bourbon', name: '믹터스 스몰 배치 버번', description: "Michter's Small Batch Bourbon (U.S.A, 700ml)", abv: 45.7, volume_ml: 700, price_glass: 13900, price_bottle: 309900, sort_order: 490 }),
  item({ category: 'whisky', subcategory: 'bourbon', name: '러셀 리저브 싱글배럴', description: "Russell's Reserve Single Barrel (U.S.A, 750ml)", abv: 55, volume_ml: 750, price_glass: 13900, price_bottle: 329900, sort_order: 500 }),
  item({ category: 'whisky', subcategory: 'bourbon', name: '이글 레어 10Y', description: 'Eagle Rare 10Y (U.S.A, 750ml)', abv: 45, volume_ml: 750, price_glass: 13900, price_bottle: 339900, sort_order: 510 }),

  item({ category: 'whisky', subcategory: 'tennessee', name: '잭 다니엘스', description: "Jack Daniel's (U.S.A, 700ml)", abv: 40, volume_ml: 700, price_glass: 6900, price_bottle: 149900, sort_order: 610 }),

  item({ category: 'shochu', name: '요카이치 무기(보리)', description: 'Yokaichi Mugi (Barley, Japan, 900ml)', abv: 25, volume_ml: 900, price_glass: 7900, price_bottle: 109900, sort_order: 10 }),
  item({ category: 'shochu', name: '요카이치 이모(고구마)', description: 'Yokaichi Imo (Sweet Potato, Japan, 900ml)', abv: 25, volume_ml: 900, price_glass: 7900, price_bottle: 109900, sort_order: 20 }),

  item({ category: 'spirits', name: '캄파리', description: 'Campari (Italy, 750ml)', abv: 25, volume_ml: 750, price_glass: 5900, price_bottle: 119900, sort_order: 10 }),
  item({ category: 'spirits', name: '파이어볼', description: 'Fireball (Canada, 700ml)', abv: 33, volume_ml: 700, price_glass: 5900, price_bottle: 119900, sort_order: 20 }),
  item({ category: 'spirits', name: '호세 쿠엘보', description: 'Jose Cuervo (Mexico, 750ml)', abv: 38, volume_ml: 750, price_glass: 5900, price_bottle: 119900, sort_order: 30 }),
  item({ category: 'spirits', name: '패트론 실버', description: 'Patron Silver (Mexico, 750ml)', abv: 40, volume_ml: 750, price_glass: 14900, price_bottle: 369900, sort_order: 40 }),
  item({ category: 'spirits', name: '앱생트', description: 'Absente (France, 700ml)', abv: 55, volume_ml: 700, price_glass: 9900, price_bottle: 219900, sort_order: 50 }),
  item({ category: 'spirits', name: '예거 마이스터', description: 'Jagermeister (Germany, 700ml)', abv: 35, volume_ml: 700, price_glass: 5900, price_bottle: 109900, sort_order: 60 }),
  item({ category: 'spirits', name: '엑스레이티드', description: 'X-rated (Italy, 750ml)', abv: 17, volume_ml: 750, price_glass: 6900, price_bottle: 159900, sort_order: 70 }),
  item({ category: 'spirits', name: '아그와', description: 'Agwa (Netherlands, 700ml)', abv: 30, volume_ml: 700, price_glass: 7900, price_bottle: 159900, sort_order: 80 }),
]

const main = async () => {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local 파일이 없습니다.')
  }

  const env = parseEnvFile(envPath)
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE 환경변수가 누락되었습니다.')
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const { data: existing, error: fetchError } = await supabase
    .from('menu_items')
    .select('id, category, name')

  if (fetchError) {
    throw new Error(`기존 메뉴 조회 실패: ${fetchError.message}`)
  }

  const existingMap = new Map()
  for (const row of existing ?? []) {
    const key = `${row.category}:${normalizeName(row.name)}`
    if (!existingMap.has(key)) {
      existingMap.set(key, row.id)
    }
  }

  let inserted = 0
  let updated = 0

  for (const row of MENU_ITEMS) {
    const key = `${row.category}:${normalizeName(row.name)}`
    const id = existingMap.get(key)

    if (id) {
      const { error } = await supabase
        .from('menu_items')
        .update(row)
        .eq('id', id)

      if (error) {
        throw new Error(`업데이트 실패 (${row.category} / ${row.name}): ${error.message}`)
      }
      updated += 1
      continue
    }

    const { error } = await supabase
      .from('menu_items')
      .insert(row)

    if (error) {
      throw new Error(`삽입 실패 (${row.category} / ${row.name}): ${error.message}`)
    }
    inserted += 1
  }

  const { count, error: countError } = await supabase
    .from('menu_items')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    throw new Error(`최종 개수 조회 실패: ${countError.message}`)
  }

  console.log(`완료: inserted=${inserted}, updated=${updated}, total=${count ?? 0}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
