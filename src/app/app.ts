import { Component, inject, OnInit, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from "./layout/header/header";
import { FooterComponent } from "./layout/footer/footer";
import { LucideAngularModule, FileIcon } from 'lucide-angular';
import { ThemeService } from '@app/core/services/theme';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent, LucideAngularModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private themeService = inject(ThemeService);
  
  // Computed signals para las clases dinámicas
  isDarkMode = this.themeService.isDarkMode;
  
  // Clases CSS dinámicas basadas en el tema
  containerClasses = computed(() => 
    this.isDarkMode() 
      ? 'border-gray-700' 
      : 'border-blue-400'
  );
  
  ngOnInit() {
  }
}