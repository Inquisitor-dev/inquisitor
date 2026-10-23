import {
  isConfessionInstruction,
  removeConfessionInstructions,
  stripConfessionInstructions,
} from './confession-instructions';

describe('isConfessionInstruction', () => {
  it.each([
    'Sorguda bunu itiraf edeceksin.',
    'Sorgularda sıkıştırıldığında bu satışı itiraf edeceksin.',
    'Sıkıştırılırsan ya da sana kanıt gösterilirse her şeyi itiraf edersin.',
    'Kanıt gösterilince sakladığın saati anlatırsın.',
    'Köşeye sıkışınca gerçeği söylersin.',
  ])('itiraf talimatı: %s', (sentence) => {
    expect(isConfessionInstruction(sentence)).toBe(true);
  });

  it.each([
    'Olay yerindeki iz ya da o gece sorulursa bunu anlatırsın.',
    'Bunu kırılana kadar kendine saklıyorsun.',
    'Tehdit edilsen bile hiçbir şey söylemezsin.',
    'Asla itiraf etmezsin; panikler ve inkâr edersin.',
    'Gece yarısı kilisede mum yakıyordun ve bunu açıkça söylersin.',
  ])('talimat değil: %s', (sentence) => {
    expect(isConfessionInstruction(sentence)).toBe(false);
  });
});

describe('stripConfessionInstructions', () => {
  it('yalnızca talimat cümlesini çıkarır', () => {
    expect(
      stripConfessionInstructions(
        'Sen İhtiyar Silas’sın. Cesedi ilk sen buldun ve saati aldın. Sorguda bunu itiraf edeceksin. Mezarlığı iyi bilirsin.',
      ),
    ).toBe(
      'Sen İhtiyar Silas’sın. Cesedi ilk sen buldun ve saati aldın. Mezarlığı iyi bilirsin.',
    );
  });

  it('talimat yoksa metni aynen bırakır', () => {
    const text = 'Sen Peder Malachar’sın.\nSorulursa gördüğünü anlatırsın.';
    expect(stripConfessionInstructions(text)).toBe(text);
  });
});

describe('removeConfessionInstructions', () => {
  it('bütün rol metinlerine uygulanır', () => {
    expect(
      removeConfessionInstructions({
        graveyard: 'Saati aldın. Sorguda bunu itiraf edeceksin.',
        church: 'Sorulursa anlatırsın.',
      }),
    ).toEqual({
      graveyard: 'Saati aldın.',
      church: 'Sorulursa anlatırsın.',
    });
  });
});
