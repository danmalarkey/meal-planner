import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AccountMenuComponent } from './account-menu.component';

@Component({
  imports: [AccountMenuComponent],
  template: `
    <app-account-menu
      userName="Dan Malarkey"
      userInitials="DM"
      userMeta="dan@example.com"
      (signOutRequested)="signOutCount = signOutCount + 1"
    ></app-account-menu>
  `
})
class AccountMenuTestHostComponent {
  signOutCount = 0;
}

describe('AccountMenuComponent', () => {
  let fixture: ComponentFixture<AccountMenuTestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountMenuTestHostComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(AccountMenuTestHostComponent);
    fixture.detectChanges();
  });

  it('groups settings and sign out under the user avatar', () => {
    const trigger = fixture.nativeElement.querySelector('.ui-popover-trigger') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();

    const settings = fixture.nativeElement.querySelector('a[href="/settings"]');
    const signOut = fixture.nativeElement.querySelector('button.ui-popover-action--danger') as HTMLButtonElement;

    expect(settings?.textContent).toContain('Settings');
    expect(signOut.textContent).toContain('Sign out');

    signOut.click();
    expect(fixture.componentInstance.signOutCount).toBe(1);
  });
});
