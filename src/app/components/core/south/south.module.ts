import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { NgProgressModule } from 'ngx-progressbar';

import { AuthCheckGuard } from '../../../guards';
import { PipesModule } from '../../../pipes/pipes.module';
import { AssetsService, SchedulesService, ServicesHealthService, FilterService } from '../../../services';
import { SharedModule } from '../../../shared.module';
import { AlertDialogModule } from '../../common/alert-dialog/alert-dialog.module';
import { AddServiceWizardComponent } from './add-service-wizard/add-service-wizard.component';
import { SouthServiceModalComponent } from './south-service-modal/south-service-modal.component';
import { SouthComponent } from './south.component';
import { FilterModule } from '../filter/filter.module';
import { DndModule } from 'ngx-drag-drop';

const routes: Routes = [

  {
    path: '',
    component: SouthComponent,
    canActivate: [AuthCheckGuard]
  },
  {
    path: 'add',
    component: AddServiceWizardComponent,
    canActivate: [AuthCheckGuard]
  },
];

@NgModule({
  declarations: [
    SouthComponent,
    AddServiceWizardComponent,
    SouthServiceModalComponent,
  ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    RouterModule.forChild(routes),
    NgProgressModule,
    AlertDialogModule,
    SharedModule,
    FilterModule,
    PipesModule,
    DndModule
  ],
  providers: [ServicesHealthService, AssetsService, SchedulesService, FilterService],
})
export class SouthModule { }
