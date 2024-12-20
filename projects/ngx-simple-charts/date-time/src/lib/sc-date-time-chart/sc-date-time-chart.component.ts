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
import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  Input,
  LOCALE_ID,
  OnInit,
  ViewChild,
} from '@angular/core';
import { DateTime, Interval } from 'luxon';
import { ChartItem } from './model/chart-item';
import { ScDateTimeChartBase } from './sc-date-time-chart-base';

interface LineKeyToItems {
  lineKey: string;
  items: ChartItem<Event>[];
}

@Component({
  selector: 'sc-date-time-chart',
  templateUrl: './sc-date-time-chart.component.html',
  styleUrls: ['./sc-date-time-chart.component.scss'],
  standalone: false,
})
export class ScDateTimeChartComponent
  extends ScDateTimeChartBase
  implements OnInit, AfterViewInit
{
  protected dayPx = -10;
  protected anchoreIdIndex = 0;
  protected nextAnchorId = '';
  protected timeChartHeight = 0;
  protected chartLineHeight = 0;
  protected lineKeyToItems: LineKeyToItems[] = [];
  protected readonly CURRENT_TIME = 'currentTime';

  @ViewChild('timeChart')
  private timeChartRef: ElementRef | null = null;
  @ViewChild('headerLine')
  private headerLineRef: ElementRef | null = null;

  constructor(@Inject(LOCALE_ID) locale: string) {
    super(locale);
  }

  ngAfterViewInit(): void {
    this.calcTimeChartValues();
    setTimeout(() => {
      let myPeriods = !this.showDays ? this.periodYears : this.periodMonths;
      myPeriods = myPeriods.filter(
        (myPeriod) => myPeriod.diffNow().seconds <= 0,
      );
      const myPeriodIndex = myPeriods.length === 0 ? -1 : myPeriods.length - 1;
      if (myPeriodIndex >= 0) {
        this.scrollToAnchorId(
          !this.showDays
            ? this.yearHeaderAnchorIds[myPeriodIndex]
            : this.monthHeaderAnchorIds[myPeriodIndex],
        );
      }
      this.calcTimeChartValues();
    }, 1000);
  }

  ngOnInit(): void {
    this.calcChartTime();
  }

  protected calcTimeChartValues(): void {
    setTimeout(() => {
      this.timeChartHeight = this.timeChartRef?.nativeElement?.offsetHeight;
      this.chartLineHeight = this.headerLineRef?.nativeElement?.clientHeight;
    });
  }

  protected scrollContainer(event: Event): void {
    //console.log((event.target as Element).scrollLeft);
    //console.log((event.target as Element).scrollWidth);
    //console.log((event.target as Element).clientWidth);
    const myScrollWidth = (event.target as Element).scrollWidth;
    const myClientWidth = (event.target as Element).clientWidth;
    const myScrollRight =
      myScrollWidth - myClientWidth - (event.target as Element).scrollLeft;
    let myScrollDayPosition = 0;
    const today = DateTime.now()
      .setLocale(this.locale)
      .setZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
      .toJSDate();
    myScrollDayPosition = myScrollWidth - this.calcStartPx(today);
    const leftDayContainerBoundary =
      myScrollDayPosition + myClientWidth < myScrollWidth
        ? myScrollWidth
        : myScrollDayPosition + myScrollWidth;
    //const rightDayContainerBoundary = myScrollDayPosition - myClientWidth  < 0 ? 0 : myScrollDayPosition - myClientWidth;
    this.dayPx =
      myScrollWidth -
      leftDayContainerBoundary -
      myScrollRight +
      myScrollDayPosition;
    //console.log(leftDayContainerBoundary);
    //console.log(rightDayContainerBoundary);
    //console.log(this.dayPx);
    //console.log(myScrollRight);
    //console.log(myScrollDayPosition);
  }

  protected calcStartPx(start: Date): number {
    const chartStart = DateTime.fromObject({
      year: this.start.getFullYear(),
      month: !this.showDays ? 1 : this.start.getMonth() + 1,
      day: 1,
    });
    const itemInterval = Interval.fromDateTimes(
      chartStart,
      !!start ? DateTime.fromJSDate(start) : chartStart,
    );
    const itemPeriods = !this.showDays
      ? itemInterval.length('months')
      : itemInterval.length('days');
    const result =
      itemPeriods * ((!this.showDays ? this.MONTH_WIDTH : this.DAY_WIDTH) + 2);
    return result;
  }

  protected calcEndPx(end: Date): number {
    const chartEnd = DateTime.fromJSDate(this.end);
    const itemInterval = Interval.fromDateTimes(
      DateTime.fromJSDate(end),
      chartEnd,
    );
    const itemPeriods = !this.showDays
      ? itemInterval.length('months')
      : itemInterval.length('days');
    const result =
      itemPeriods * ((!this.showDays ? this.MONTH_WIDTH : this.DAY_WIDTH) + 2);
    return result;
  }

  protected calcStartPxItem(item: ChartItem<Event>): number {
    return this.calcStartPx(item.start as Date);
  }

  protected calcEndPxItem(item: ChartItem<Event>): number {
    if (!item?.end) {
      return 0;
    }
    return this.calcEndPx(item.end);
  }

  protected calcWidthPxItem(item: ChartItem<Event>): number {
    const chartStart = DateTime.fromObject({
      year: this.start.getFullYear(),
      month: !this.showDays ? 1 : this.start.getMonth() + 1,
      day: 1,
    });
    const chartEnd = DateTime.fromJSDate(this.end);
    const itemInterval = Interval.fromDateTimes(chartStart, chartEnd);
    const itemPeriods = !this.showDays
      ? itemInterval.length('months')
      : Math.ceil(itemInterval.length('days')); //Math.ceil() for full days
    //console.log(itemDays * (this.DAY_WIDTH + 2));
    //console.log(itemDays);
    const result =
      itemPeriods * ((!this.showDays ? this.MONTH_WIDTH : this.DAY_WIDTH) + 2) -
      2 -
      (this.calcStartPxItem(item) + this.calcEndPxItem(item));
    return result;
  }

  protected scrollToTime(timeDiff: number): void {
    const anchorIds = !this.showDays
      ? this.yearHeaderAnchorIds
      : this.monthHeaderAnchorIds;
    this.anchoreIdIndex =
      this.anchoreIdIndex + timeDiff < 0
        ? 0
        : this.anchoreIdIndex + timeDiff >= anchorIds.length
          ? anchorIds.length - 1
          : this.anchoreIdIndex + timeDiff;
    this.scrollToAnchorId(anchorIds[this.anchoreIdIndex]);
  }

  protected scrollToAnchorId(anchorId: string): void {
    const element = document.getElementById(anchorId);
    element?.scrollIntoView({
      block: 'start',
      behavior: 'smooth',
      inline: 'nearest',
    });
  }

  private updateLineKeyToItems(): void {
    const lineKeyToItems = new Map<string, ChartItem<Event>[]>();
    this.localItems.forEach((myItem) => {
      const myItems = !lineKeyToItems.get(myItem.lineId)
        ? []
        : lineKeyToItems.get(myItem.lineId);
      myItems?.push(myItem);
      lineKeyToItems.set(myItem.lineId, myItems as ChartItem<Event>[]);
    });
    for (; this.lineKeyToItems.length > 0; this.lineKeyToItems.pop()) {}
    for (let key of lineKeyToItems.keys()) {
      const myLineKeyToItem = {
        lineKey: key,
        items: lineKeyToItems.get(key),
      } as LineKeyToItems;
      this.lineKeyToItems.push(myLineKeyToItem);
    }
  }

  get items(): ChartItem<Event>[] {
    return this.localItems;
  }

  @Input({ required: true })
  set items(items: ChartItem<Event>[]) {
    this.localItems = items;
    this.updateLineKeyToItems();
    this.calcChartTime();
    this.calcTimeChartValues();
  }

  get start(): Date {
    return this.localStart;
  }

  @Input()
  set start(start: Date) {
    this.localStart = DateTime.fromJSDate(start)
      .setLocale(this.locale)
      .setZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
      .toJSDate();
    this.calcChartTime();
    this.calcTimeChartValues();
  }

  get showDays(): boolean {
    return this.localShowDays;
  }

  @Input({ required: true })
  set showDays(showDays: boolean) {
    this.localShowDays = showDays;
    this.calcChartTime();
    this.calcTimeChartValues();
  }
}
