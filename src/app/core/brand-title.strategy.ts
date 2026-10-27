import { Injectable, Injector, effect, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { BrandService } from './brand.service';

@Injectable({ providedIn: 'root' })
export class BrandTitleStrategy extends TitleStrategy {
  private title = inject(Title);
  private injector = inject(Injector);
  private brand?: BrandService;
  private pageTitle: string | undefined;

  override updateTitle(snapshot: RouterStateSnapshot) {
    this.pageTitle = this.buildTitle(snapshot);
    if (!this.brand) {
      this.brand = this.injector.get(BrandService);
      // Runs again whenever the system name changes in Settings
      effect(() => this.apply(), { injector: this.injector });
    }
    this.apply();
  }

  private apply() {
    if (!this.brand) return;
    const name = this.brand.systemName();
    this.title.setTitle(this.pageTitle ? `${this.pageTitle} | ${name}` : name);
  }
}