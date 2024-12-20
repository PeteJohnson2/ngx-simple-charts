/**
 *    Copyright 2019 Sven Loesekann
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */
import { DateTime } from 'luxon';
import { ChartItem } from './model/chart-item';

export class ScDateTimeChartBase {
  protected localStart = new Date();
  protected localShowDays: boolean = false;
  protected end: Date | null = null;
  protected localItems: ChartItem<Event>[] = [];
  protected periodDays: DateTime[] = [];
  protected periodMonths: DateTime[] = [];
  protected periodYears: DateTime[] = [];
  protected monthHeaderAnchorIds: string[] = [];
  protected yearHeaderAnchorIds: string[] = [];
  protected readonly DAY_WIDTH = 20;
  protected readonly MONTH_WIDTH = 100;

  constructor(protected locale: string) {}

  protected calcChartTime(): void {
    this.localStart = !this.localStart ? new Date() : this.localStart;
    if (this.localItems.length < 1) {
      return;
    }
    this.localStart = this.localItems
      .map((myItem) => myItem.start)
      .filter((myStart) => !!myStart)
      .reduce(
        (acc, myItem) =>
          (myItem as Date).valueOf() < (acc as Date).valueOf() ? myItem : acc,
        new Date(),
      ) as Date;
    //console.log(this.localStart);
    /*
    const startOfChart = DateTime.fromJSDate(this.localStart)
      .setLocale(this.locale)
      .setZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
      .toJSDate();
      */
    const myEndOfYear = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59);
    const endOfYear = DateTime.fromJSDate(myEndOfYear)
      .setLocale(this.locale)
      .setZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
      .toJSDate();
    const lastEndItem = this.localItems.reduce((acc, newItem) => {
      const accEnd = !!acc?.end?.valueOf() ? acc?.end?.valueOf() : -1;
      const newItemEnd = !!newItem?.end?.valueOf()
        ? newItem?.end?.valueOf()
        : -1;
      return accEnd < newItemEnd ? newItem : acc;
    });
    const openEndItems = this.localItems.filter((newItem) => !newItem?.end);
    const lastEndYear = !!lastEndItem?.end?.getFullYear()
      ? lastEndItem!.end.getFullYear()
      : -1;
    this.end =
      openEndItems.length > 0 || !this.localShowDays
        ? endOfYear
        : lastEndYear < 1
          ? endOfYear
          : lastEndItem.end;
    this.periodDays = [];
    for (
      let myDay = DateTime.fromObject({
        year: this.localStart.getFullYear(),
        month: this.localStart.getMonth() + 1,
        day: 1,
      });
      myDay.toMillis() <= DateTime.fromJSDate(this.end).toMillis();
      myDay = myDay.plus({ days: 1 })
    ) {
      this.periodDays.push(myDay);
    }
    this.periodMonths = [];
    this.monthHeaderAnchorIds = [];
    for (
      let myMonth = DateTime.fromObject({
        year: this.localStart.getFullYear(),
        month: !!this.localShowDays ? this.localStart.getMonth() + 1 : 1,
        day: 1,
      });
      myMonth.toMillis() <= DateTime.fromJSDate(this.end).toMillis();
      myMonth = myMonth.plus({ months: 1 })
    ) {
      this.periodMonths.push(myMonth);
      this.monthHeaderAnchorIds.push(
        'M_' + this.generateHeaderAnchorId(myMonth),
      );
    }
    this.periodYears = [];
    this.yearHeaderAnchorIds = [];
    for (
      let myYear = DateTime.fromObject({
        year: this.localStart.getFullYear(),
        month: 1,
        day: 1,
      });
      myYear.toMillis() <= DateTime.fromJSDate(this.end).toMillis();
      myYear = myYear.plus({ years: 1 })
    ) {
      this.periodYears.push(myYear);
      this.yearHeaderAnchorIds.push('Y_' + this.generateHeaderAnchorId(myYear));
    }
    //console.log(`start: ${this.localStart} end: ${this.end}`);
  }

  protected generateHeaderAnchorId(dateTime: DateTime): string {
    const headerAnchorId =
      '' +
      dateTime.year +
      '_' +
      dateTime.month +
      '_' +
      new Date().getMilliseconds().toString(16);
    return headerAnchorId;
  }
}
