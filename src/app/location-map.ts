import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MapRules } from './business-rules';

@Component({
  selector: 'location-map',
  standalone: true,
  template: `
    <section class="google-map" [class.compact]="compact()" [attr.aria-label]="'Mapa de ' + title()">
      <iframe
        class="google-map-frame"
        [src]="embedUrl()"
        [title]="'Ubicación de ' + title()"
        loading="lazy"
        referrerpolicy="strict-origin-when-cross-origin"
        allowfullscreen>
      </iframe>
      <div class="google-map-meta">
        <div><span class="map-pin" aria-hidden="true">●</span><span><b>{{ title() }}</b><small>{{ address() }}</small></span></div>
        <nav aria-label="Acciones del mapa">
          <a [href]="searchUrl()" target="_blank" rel="noopener noreferrer">Ver en Google Maps</a>
          <a [href]="directionsUrl()" target="_blank" rel="noopener noreferrer">Cómo llegar</a>
        </nav>
      </div>
    </section>
  `,
})
export class LocationMapComponent {
  private readonly sanitizer = inject(DomSanitizer);
  readonly latitude = input.required<number>();
  readonly longitude = input.required<number>();
  readonly title = input.required<string>();
  readonly address = input('Lima, Perú');
  readonly compact = input(false);
  readonly embedUrl = computed(() => this.sanitizer.bypassSecurityTrustResourceUrl(MapRules.embedUrl(this.latitude(), this.longitude(), this.compact() ? 16 : 15)));
  readonly searchUrl = computed(() => MapRules.searchUrl(this.latitude(), this.longitude()));
  readonly directionsUrl = computed(() => MapRules.directionsUrl(this.latitude(), this.longitude()));
}
