import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { sortBy } from 'lodash';
import { interval, Subscription } from 'rxjs';

import { PingService, ServicesApiService, ProgressBarService, SharedService } from '../../../services';
import { AlertService } from '../../../services/alert.service';
import { POLLING_INTERVAL } from '../../../utils';
import { SouthServiceModalComponent } from './south-service-modal/south-service-modal.component';
import { ViewLogsComponent } from '../packages-log/view-logs/view-logs.component';

@Component({
  selector: 'app-south',
  templateUrl: './south.component.html',
  styleUrls: ['./south.component.css']
})
export class SouthComponent implements OnInit, OnDestroy {
  public service;
  public southboundServices = [];
  public refreshSouthboundServiceInterval = POLLING_INTERVAL;
  public showSpinner = false;
  private isAlive: boolean;
  private subscription: Subscription;

  @ViewChild(SouthServiceModalComponent) southServiceModal: SouthServiceModalComponent;
  @ViewChild(ViewLogsComponent) viewLogsComponent: ViewLogsComponent;

  constructor(private servicesApiService: ServicesApiService,
    private alertService: AlertService,
    public ngProgress: ProgressBarService,
    private router: Router,
    private ping: PingService,
    private sharedService: SharedService) {
    this.isAlive = true;
    this.ping.pingIntervalChanged.subscribe((timeInterval: number) => {
      if (timeInterval === -1) {
        this.isAlive = false;
      }
      this.refreshSouthboundServiceInterval = timeInterval;
    });
  }

  ngOnInit() {
    this.showLoadingSpinner();
    this.getSouthboundServices(false);
    interval(this.refreshSouthboundServiceInterval)
      .takeWhile(() => this.isAlive) // only fires when component is alive
      .subscribe(() => {
        this.getSouthboundServices(true);
      });
      this.subscription = this.sharedService.showLogs.subscribe(showPackageLogs => {
      if (showPackageLogs.isSubscribed) {
        // const closeBtn = <HTMLDivElement>document.querySelector('.modal .delete');
        // if (closeBtn) {
        //   closeBtn.click();
        // }
        this.viewLogsComponent.toggleModal(true, showPackageLogs.fileLink);
        showPackageLogs.isSubscribed = false;
      }
    });
  }

  public getSouthboundServices(caching: boolean) {
    this.servicesApiService.getSouthServices(caching).
      subscribe(
        (data: any) => {
          this.southboundServices = data['services'];
          this.southboundServices = sortBy(this.southboundServices, function (svc) {
            return svc['status'] === 'shutdown';
          });
          this.hideLoadingSpinner();
        },
        error => {
          this.hideLoadingSpinner();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  addSouthService() {
    this.router.navigate(['/south/add']);
  }

  /**
 * Open create scheduler modal dialog
 */
  openSouthServiceModal(service) {
    this.service = service;
    this.southServiceModal.service = service;
    this.southServiceModal.toggleModal(true);
  }

  onNotify() {
    this.getSouthboundServices(false);
  }

  public showLoadingSpinner() {
    this.showSpinner = true;
  }

  public hideLoadingSpinner() {
    this.showSpinner = false;
  }

  public ngOnDestroy(): void {
    this.isAlive = false;
    this.subscription.unsubscribe();
  }
}
