import { section1 } from './data1';
import { section2 } from './data2';
import { section3 } from './data3';
import { section4 } from './data4';
import { section5 } from './data5';
import { section6 } from './data6';

export interface Stage {
  id: string;
  title: string;
  description: string;
  image: string;
  content: string;
}

export interface Section {
  id: string;
  title: string;
  stages: Stage[];
}

export const historyData: Section[] = [
  section1,
  section2,
  section3,
  section4,
  section5,
  section6
];
