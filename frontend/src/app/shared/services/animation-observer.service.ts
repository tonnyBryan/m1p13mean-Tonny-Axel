import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AnimationObserverService {

    observe(elements: NodeListOf<Element> | Element[], options?: IntersectionObserverInit): void {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -60px 0px',
            ...options
        });

        elements.forEach(el => observer.observe(el));
    }
}