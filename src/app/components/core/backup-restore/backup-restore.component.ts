import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { interval } from 'rxjs';

import { DateFormatterPipe } from '../../../pipes';
import { AlertService, PingService, ProgressBarService } from '../../../services';
import { BackupRestoreService } from '../../../services/backup-restore.service';
import { POLLING_INTERVAL } from '../../../utils';
import { AlertDialogComponent } from '../../common/alert-dialog/alert-dialog.component';

@Component({
  selector: 'app-backup-restore',
  templateUrl: './backup-restore.component.html',
  styleUrls: ['./backup-restore.component.css']
})
export class BackupRestoreComponent implements OnInit, OnDestroy {
  public backupData = [];
  private isAlive: boolean; // used to unsubscribe from the IntervalObservable
                            // when OnDestroy is called.

  // Object to hold child data
  public childData = {
    id: '',
    name: '',
    message: '',
    key: ''
  };
  public showSpinner = false;
  public refreshInterval = POLLING_INTERVAL;

  @ViewChild(AlertDialogComponent) child: AlertDialogComponent;

  constructor(private backupRestoreService: BackupRestoreService,
    private alertService: AlertService,
    public ngProgress: ProgressBarService,
    private dateFormatter: DateFormatterPipe,
    private ping: PingService) {
    this.isAlive = true;
    this.ping.pingIntervalChanged.subscribe((timeInterval: number) => {
      if (timeInterval === -1) {
        this.isAlive = false;
      }
      this.refreshInterval = timeInterval;
    });
  }

  ngOnInit() {
    this.getBackup();
    interval(this.refreshInterval)
      .takeWhile(() => this.isAlive) // only fires when component is alive
      .subscribe(() => {
        this.getBackup();
      });
  }

  /**
  * Open modal
  */
  openModal(id, name, message, key) {
    this.childData = {
      id: id,
      name: name,
      message: message,
      key: key
    };
    // call child component method to toggle modal
    this.child.toggleModal(true);
  }


  public getBackup() {
    this.backupRestoreService.get().
      subscribe(
        (data) => {
          this.backupData = data['backups'];
          this.hideLoadingSpinner();
        },
        error => {
          this.hideLoadingSpinner();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        }
      );
  }

  public requestBackup() {
    if (this.backupData.length === 0) {
      this.showLoadingSpinner();
    }
    this.backupRestoreService.requestBackup().
      subscribe(
        (data) => {
          this.alertService.info(data['status']);
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        }
      );
  }

  public restoreBackup(id) {
    this.ngProgress.start();
    this.backupRestoreService.restoreBackup(id).
      subscribe(
        (data) => {
          this.alertService.info(data['status']);
          this.getBackup();
          this.ngProgress.done();
        },
        error => {
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        }
      );
  }

  public deleteBackup(id) {
    this.ngProgress.start();
    this.backupRestoreService.deleteBackup(id).
      subscribe(
        (data) => {
          this.ngProgress.done();
          this.alertService.success(data['message']);
          this.getBackup();
        },
        error => {
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        }
      );
  }

  public async downloadBackup(backup): Promise<void> {
    const blob = await this.backupRestoreService.downloadBackup(backup.id);
    const url = window.URL.createObjectURL(blob);
    // create a custom anchor tag
    const a = document.createElement('a');
    a.href = url;
    const date = this.dateFormatter.transform(backup.date, 'YYYY_MM_DD_HH_mm_ss');
    a.download = 'foglamp_backup_' + date + '.tar.gz';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  public showLoadingSpinner() {
    this.showSpinner = true;
  }

  public hideLoadingSpinner() {
    this.showSpinner = false;
  }

  ngOnDestroy() {
    this.isAlive = false;
  }
}
