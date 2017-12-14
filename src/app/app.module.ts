import { BrowserModule } from '@angular/platform-browser';
import {Component, NgModule} from "@angular/core";
import {RouterModule} from "@angular/router";
import {timer} from "rxjs/observable/timer";
import "rxjs/add/operator/first";
import "rxjs/add/operator/map";

@Component({
  selector: 'app-root',
  template: `
    <h1>App</h1>

    <div style="background-color: aqua; height: 300px; font-size: 20px;">
      <router-outlet></router-outlet>
    </div>

    <div>
      <a routerLink="/a/b">a/b</a>
      <a routerLink="/a/bb">a/bb</a>
      <a routerLink="/aa">aa</a>
    </div>

  `
})
export class AppComponent {}

@Component({
  selector: 'component-a',
  template: `
    component a
    <div style="background-color: yellow; height: 200px;">
      <router-outlet></router-outlet>
    </div>
  `
})
export class ComponentA {}

@Component({
  selector: 'component-b',
  template: 'component b'
})
export class ComponentB {}

@Component({
  selector: 'component-aa',
  template: 'component aa'
})
export class ComponentAA {}

@Component({
  selector: 'component-bb',
  template: 'component bb'
})
export class ComponentBB {}

@NgModule({
  declarations: [
    ComponentAA
  ],
  exports: [
    ComponentAA
  ],
  imports: [
    RouterModule.forChild([{path: '', component: ComponentAA}])
  ]
})
export class LazyLoaded {}

function observableWithDelay() {
  return timer(500).first().map(e => true);
}

function loadChildren() {
  return timer(1000).first().map(e => LazyLoaded);
}

@NgModule({
  declarations: [
    AppComponent,
    ComponentA,
    ComponentB,
    ComponentBB
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot([
      {path: "", pathMatch: "full", redirectTo: "/a/b"},
      {
        path: "a", component: ComponentA, children: [
          {path: "b", component: ComponentB, canActivate: ['canActivate']},
          {path: "bb", component: ComponentBB, canActivate: ['canActivate']}
        ]
      },
      {path: "aa", loadChildren }
    ], { enableTracing: true })
  ],
  providers: [
    { provide: 'canActivate', useValue: observableWithDelay}
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
