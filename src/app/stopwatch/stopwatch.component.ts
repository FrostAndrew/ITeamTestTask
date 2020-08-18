import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {fromEvent, Observable, Subscription} from "rxjs";
import {buffer, debounceTime, filter, map} from "rxjs/operators";

interface StopwatchState {
  seconds: number;
  minutes: number;
  hours: number;

  isTicks: boolean;
  textFormat: string;
}

@Component({
  selector: 'app-stopwatch',
  templateUrl: './stopwatch.component.html',
  styleUrls: ['./stopwatch.component.scss']
})
export class StopwatchComponent implements AfterViewInit{
  @ViewChild('DoubleClickWaitButton', {static: false}) waitButton : ElementRef;

  state: StopwatchState;
  timeStream$: Observable<void>;
  clickStream$: Observable<any>;
  doubleClickSub: Subscription;
  timeSub: Subscription;
  observer: any;

  constructor() {
    this.timeStream$ = new Observable<void>((observer) => {
      const interval = setInterval(
        _ => observer.next(),
        1000
      );
      return () => {clearInterval(interval); };
    });

    this.observer = {
      next: (_) => this.StateTick(),
      error: err => console.error('An observer error:' + err),
      complete: () => alert('Complete')
    };
    this.state = {
      seconds: 0,
      minutes: 0,
      hours: 0,
      isTicks: false,
      textFormat: '00:00:00'
    };

  }
  // After View Init to use ViewChild
  ngAfterViewInit(): void {
    this.clickStream$ = fromEvent(this.waitButton.nativeElement, 'click');
    this.clickStream$.subscribe();

    this.doubleClickSub = this.clickStream$.pipe(
      buffer( this.clickStream$.pipe(debounceTime(299))),
      map(clickArr => clickArr.length),
      filter(numberOfClicks => numberOfClicks == 2)
    ).subscribe(_ => this.state.isTicks? this.StartStopTime(false) : null);
  }

  async StateTick(): Promise<void> {
    if(this.state.seconds + 1 == 60) {
      if(this.state.minutes + 1 == 60) {
        this.state.hours++;
        this.state.minutes = 0;
      } else this.state.minutes++;
      this.state.seconds = 0;
      this.state.textFormat = this.GetBeautifiedTime();
      return;
    }
    this.state.seconds++;
    this.state.textFormat = this.GetBeautifiedTime();
    console.log(this.state);
  }

  // Zeroing time
  async NullStopWatch(): Promise<void> {
    this.state.seconds = this.state.minutes = this.state.hours = 0;
    this.state.textFormat = this.GetBeautifiedTime();
  }
  // To Start or to stop count
  StartStopTime(isZeroingWatch: boolean): void {
    this.state.isTicks = !this.state.isTicks;
    if(this.timeSub == null || this.timeSub.closed) {
      this.timeSub = this.timeStream$.subscribe(this.observer);
      console.log('Subscribed');
      return;
    }
    this.timeSub.unsubscribe();

    isZeroingWatch? this.NullStopWatch() : console.log('Paused');
    console.log('Unsubscribed');
  }

  // To get time as string HH:MM:SS format
  GetBeautifiedTime(): string {
    let str: string = '';

    if (this.state.hours < 10) str += '0';
    str += this.state.hours + ':';
    if (this.state.minutes < 10) str += '0';
    str += this.state.minutes + ':';
    if (this.state.seconds < 10) str += '0';
    str += this.state.seconds;

    return str;
  }
}
