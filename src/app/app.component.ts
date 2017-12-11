import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import "rxjs/add/operator/map";
import "rxjs/add/operator/merge";
import 'rxjs/add/operator/debounceTime';


interface sortBy {
  field: string;
  dir: ('asc' | 'desc')
}

interface field {
  name: string;
  caption: string;
}


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';

  public data$: BehaviorSubject<any[]>;
  public pageData$: BehaviorSubject<any[]>;
  public page$: BehaviorSubject<number>;
  public sorting$: BehaviorSubject<sortBy>;
  public search$: BehaviorSubject<string>;
  public pageCount$: BehaviorSubject<number>;

  private pageSize = 20;

  public fields: field[] = [
    { name: 'index', caption: 'Index' },
    { name: 'name', caption: 'Name' },
    { name: 'age', caption: 'Age' },
    { name: 'email', caption: 'Email' },
    { name: 'phone', caption: 'Phone' },
  ];

  constructor(private http: HttpClient) { }

  ngOnInit(): void {

    this.data$ = new BehaviorSubject([]);
    this.pageData$ = new BehaviorSubject([]);
    this.sorting$ = new BehaviorSubject(null);
    this.page$ = new BehaviorSubject(0);
    this.pageCount$ = new BehaviorSubject(0);
    this.search$ = new BehaviorSubject("");

    this.data$
      .merge(this.sorting$)
      .merge(this.page$)
      .merge(this.search$.debounceTime(300))
      .subscribe(() => {
        let rows = this.data$.value.slice();
        const page = this.page$.value;
        const sortBy = this.sorting$.value;
        const search = this.search$.value;

        if (search && search.trim()) {
          const searchText = search.trim().toLowerCase();
          rows = rows.filter((item) => {
            return Object.keys(item).some(t => {
              const value = new String(item[t]);
              return value ? value.toLowerCase().includes(searchText) : false;
            }
            );
          });
        }

        const pageCount = Math.ceil(rows.length / this.pageSize);

        this.pageCount$.next(pageCount);

        if (sortBy) {
          rows.sort((a, b) => {
            if (a[sortBy.field] < b[sortBy.field])
              return sortBy.dir === 'asc' ? -1 : 1;
            if (a[sortBy.field] > b[sortBy.field]) {
              return sortBy.dir === 'asc' ? 1 : -1;
            }
            return 0;
          })
        }

        let pageData = [];
        if (rows.length > page * this.pageSize) {

          pageData = rows.slice(page * this.pageSize, (page + 1) * this.pageSize);
        }
        this.pageData$.next(pageData);
      })

    this.http.get('/assets/data.json').subscribe(data => {
      this.data$.next(<any[]>data);
    });
  }

  public sortBy(fieldName: string) {
    if (this.sorting$.value && this.sorting$.value.field == fieldName) {
      if (this.sorting$.value.dir == 'asc') {
        this.sorting$.next({ field: fieldName, dir: 'desc' });
      } else {
        this.sorting$.next(null);
      }
    } else {
      this.sorting$.next({ field: fieldName, dir: 'asc' });
    }
  }

  public search(text) {
    this.search$.next(text);
  }

}
