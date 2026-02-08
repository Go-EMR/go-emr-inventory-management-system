import { Routes } from '@angular/router';

export const LOT_BARCODES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/lot-barcode-list/lot-barcode-list.component').then(
        (m) => m.LotBarcodeListComponent
      ),
    title: 'Lot Barcodes'
  },
  {
    path: 'generate',
    loadComponent: () =>
      import('./components/lot-barcode-generator/lot-barcode-generator.component').then(
        (m) => m.LotBarcodeGeneratorComponent
      ),
    title: 'Generate Lot Barcode'
  },
  {
    path: 'scan',
    loadComponent: () =>
      import('./components/lot-scanner/lot-scanner.component').then(
        (m) => m.LotScannerComponent
      ),
    title: 'Scan Lot Barcode'
  }
];
