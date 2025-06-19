import { masterData } from './constant';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  state: number = 0;
  count: number = 0;
  data = masterData;
  current: any;
  currentDay: number = 1;
  currentExercise: any;
  nextExercise: any;
  todayExercises: any[] = [];
  lastWorkoutDate: string | null = null;

  workoutStartTime: number = 0;
  workoutTotalTime: number = 0;
  restStartTime: number = 0;
  restTime: number = 0;
  isResting: boolean = false;
  timerInterval: any;

  ngOnInit(): void {
    this.loadWorkoutData();
    this.loadTodayExercises();
  }

  loadWorkoutData(): void {
    const savedDay = localStorage.getItem('currentDay');
    const savedCount = localStorage.getItem('workoutCount');
    const savedDate = localStorage.getItem('lastWorkoutDate');
    const today = new Date().toDateString();

    if (savedDate === today) {
      this.currentDay = savedDay ? parseInt(savedDay) : 1;
      this.count = savedCount ? parseInt(savedCount) : 0;
    } else if (savedDate) {
      this.currentDay = savedDay ? (parseInt(savedDay) % 7) + 1 : 1;
      this.count = savedCount ? parseInt(savedCount) + 1 : 1;
      this.saveWorkoutData();
    } else {
      this.currentDay = 1;
      this.count = 1;
      this.saveWorkoutData();
    }

    this.lastWorkoutDate = today;
  }

  saveWorkoutData(): void {
    localStorage.setItem('currentDay', this.currentDay.toString());
    localStorage.setItem('workoutCount', this.count.toString());
    localStorage.setItem('lastWorkoutDate', new Date().toDateString());
  }

  loadTodayExercises(): void {
    this.current = this.data.days.find(day => day.day === this.currentDay);

    if (!this.current || this.current.day === 7) {
      this.todayExercises = [];
      return;
    }

    this.todayExercises = [];
    if (this.current.exercises) {
      let idCounter = 1;
      for (let i = 0; i < this.data.repeat; i++) {
        this.current.exercises.forEach((exercise: any) => {
          this.todayExercises.push({
            id: idCounter++,
            ...exercise,
            rest: (idCounter > this.current.exercises.length * this.data.repeat) ? 0 : exercise.rest,
            setNumber: i + 1,
            totalSets: this.data.repeat,
            finished: false,
          });
        });
      }
    }

    if (this.todayExercises.length > 0) {
      this.currentExercise = this.todayExercises[0];
      this.nextExercise = this.todayExercises[1];
    }
  }

  onStart(): void {
    this.state = 1
    this.workoutStartTime = Date.now();
    this.timerInterval = setInterval(() => {
      this.workoutTotalTime = Math.floor((Date.now() - this.workoutStartTime) / 1000);
    }, 1000);
  }

  onFinish(id: number): void {
    const exercise = this.todayExercises.find(ex => ex.id === id);
    if (!exercise) return;

    exercise.finished = true;
    this.currentExercise = exercise; // Ensure currentExercise is set for countdown

    // Start rest countdown
    this.isResting = true;
    this.restStartTime = Date.now();
    this.restTime = 0; // Reset rest time counter
    clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      // Calculate elapsed time and remaining time
      this.restTime = Math.floor((Date.now() - this.restStartTime) / 1000);
      const remainingTime = exercise.rest - this.restTime;

      // Update countdown display
      if (remainingTime <= 0) {
        clearInterval(this.timerInterval);
        if (id === this.todayExercises[this.todayExercises.length - 1].id) {
          this.onEnd();
        } else {
          this.onNext();
        }
      }
    }, 10);
  }

  onNext(): void {
    clearInterval(this.timerInterval);
    this.isResting = false;
    this.restTime = 0;

    const currentIndex = this.todayExercises.findIndex(ex => ex.id === this.currentExercise.id);

    if (currentIndex < this.todayExercises.length - 1) {
      this.currentExercise = this.todayExercises[currentIndex + 1];
      if (currentIndex + 2 <= this.todayExercises.length) {
        this.nextExercise = this.todayExercises[currentIndex + 2];
      } else {
        this.nextExercise = null;
      }

      // Start workout timer for new exercise
      this.workoutStartTime = Date.now();
      this.timerInterval = setInterval(() => {
        this.workoutTotalTime = Math.floor((Date.now() - this.workoutStartTime) / 1000);
      }, 1000);
    } else {
      this.onEnd();
    }
  }

  onMoreRest(): void {
    // Add 10 seconds to rest time
    this.restStartTime += 10000; // Move start time back 10 seconds

    // Update displayed rest time
    this.restTime = Math.floor((Date.now() - this.restStartTime) / 1000);

    // Optional: Notify user
    console.log('Added 10 seconds to rest time');
  }

  onEnd(): void {
    this.state = 2
    clearInterval(this.timerInterval);
    this.isResting = false;
    this.restTime = 0;

    this.workoutTotalTime = Math.floor((Date.now() - this.workoutStartTime) / 1000);
    console.log(`Total workout time: ${this.workoutTotalTime} seconds`);

    // Save workout completion
    this.saveWorkoutData();
  }

  getWorkoutTotalTime(): string {
    const hours = Math.floor(this.workoutTotalTime / 3600);
    const minutes = Math.floor((this.workoutTotalTime % 3600) / 60);
    const seconds = this.workoutTotalTime % 60;

    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':');
  }

  getRestTime(): string {
    if (!this.currentExercise) return '00:00:00';

    // Calculate remaining rest time (exercise.rest is in seconds)
    const remainingTime = this.currentExercise.rest - this.restTime;

    // Ensure we don't show negative time
    const displayTime = Math.max(0, remainingTime);

    const hours = Math.floor(displayTime / 3600);
    const minutes = Math.floor((displayTime % 3600) / 60);
    const seconds = displayTime % 60;

    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':');
  }

}