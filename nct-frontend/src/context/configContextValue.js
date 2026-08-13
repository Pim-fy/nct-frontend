import { createContext } from 'react';

export const ConfigContext = createContext(null);

export const defaultConfig = {
  pageTitle: '에누리컷',
  logoText: '에누리컷',
  'user.isAuth': false,
  'footer.zipCode': '00000',
  'footer.address': '서울특별시 강남구 테헤란로 123',
  'footer.phone': '02-1234-5678',
  'footer.fax': '02-1234-5679',
  'footer.slogan': '실시간 경매와 생활 서비스를 한 화면에서',
  'footer.subSlogan': '누구나 쉽게 이용하는 C2C 마켓플레이스',
  'footer.copyright': '© 2026 에누리컷. All rights reserved.',
  'footer.portfolioNotice': '본 사이트는 포트폴리오 목적으로 제작된 프로젝트입니다.',
  'footer.devTeam': [],
};
