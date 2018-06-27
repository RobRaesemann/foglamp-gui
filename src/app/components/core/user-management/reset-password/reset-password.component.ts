import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgProgress } from 'ngx-progressbar';

import { AlertService, UserService } from '../../../../services';
import { SharedService } from '../../../../services/shared.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  public userRecord: any = {};
  public userName: string;

  constructor(private alertService: AlertService,
    private userService: UserService,
    public ngProgress: NgProgress,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private sharedService: SharedService) {
    // get username from url
    this.userName = this.activatedRoute.snapshot.queryParams['username'];
  }

  ngOnInit() {}

  public resetUserForm(form: NgForm) {
    form.controls['currentPassword'].reset();
    form.controls['password'].reset();
    form.controls['confirmPassword'].reset();
  }

  public resetPassword(form: NgForm) {
    const passwordPayload: any = {
      current_password: form.controls['currentPassword'].value,
      new_password: form.controls['password'].value
    };
    this.ngProgress.start();
    this.userService.changePassword(passwordPayload, this.userName).
      subscribe(
        (data) => {
          this.ngProgress.done();
          this.alertService.success(data['message'], true);
          if (form != null) {
            this.resetUserForm(form);
          }
          this.router.navigate(['/login'], {replaceUrl: true});
        },
        error => {
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }
}

