import {
  Component,
  ViewChild,
  OnInit,
  ElementRef,
  AfterViewInit
} from '@angular/core';
import {
  saveAs
} from 'file-saver';

declare const WebViewer: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('viewer') viewer: ElementRef;
  wvInstance: any;
  isCustomActive: boolean = true;
  isBasicActive: boolean = false;
  isImportActive = false;
  viewerInstance: any;

  ngAfterViewInit(): void {

  }

  ngOnInit() {
    this.wvDocumentLoadedHandler = this.wvDocumentLoadedHandler.bind(this);
    this.customAnnotation();
  }

  wvDocumentLoadedHandler(): void {
    // you can access docViewer object for low-level APIs
    const docViewer = this.wvInstance.docViewer;
    const annotManager = this.wvInstance.annotManager;
    // and access classes defined in the WebViewer iframe
    const {
      Annotations
    } = this.wvInstance;
    const rectangle = new Annotations.RectangleAnnotation();
    rectangle.PageNumber = 1;
    rectangle.X = 100;
    rectangle.Y = 100;
    rectangle.Width = 250;
    rectangle.Height = 250;
    rectangle.StrokeThickness = 5;
    rectangle.Author = annotManager.getCurrentUser();
    annotManager.addAnnotation(rectangle);
    annotManager.drawAnnotations(rectangle.PageNumber);
    // see https://www.pdftron.com/api/web/WebViewer.html for the full list of low-level APIs
  }

  basicAnnotation() {
    console.log('Basic Called');
    this.wvInstance.loadDocument('https://pdftron.s3.amazonaws.com/downloads/pl/webviewer-demo.pdf');
  }

  customAnnotation() {
    //init webviewer once, after you can loadDocument for loading different comments or annots
    WebViewer({
      path: '../lib',
      initialDoc: '../files/combinepdf.pdf',
      css: '../files/styles.css'
    }, this.viewer.nativeElement).then((instance) => {

      this.wvInstance = instance;

      // instance.setTheme({
      //   primary: '#2C2B3A',
      //   secondary: '#4D4C5F',
      //   border: '#555555',
      //   buttonHover: '#686880',
      //   buttonActive: '#686880',
      //   text: '#FFFFFF',
      //   icon: '#FFFFFF',
      //   iconActive: '#FFFFFF'
      // });

      var nextPageButton = {
        type: 'statefulButton',
        initialState: 'Page',
        states: {
          Page: {
            // Checkout https://www.pdftron.com/api/web/WebViewer.html to see more APIs related with viewerInstance
            getContent: function() {
              return instance.getCurrentPageNumber();
            },
            onClick: function() {
              var currentPage = instance.getCurrentPageNumber();
              var totalPages = instance.getPageCount();
              var atLastPage = currentPage === totalPages;
      
              if (atLastPage) {
                instance.goToFirstPage();
              } else {
                instance.goToNextPage();
              }
            }
          }
        },
        mount: function(update) {
          // Checkout https://www.pdftron.com/api/web/CoreControls.DocumentViewer.html to see more APIs and events with docViewer
          instance.docViewer.on('pageNumberUpdated.nextPageButton', function() {
            // We want to update this button when page number changes so it can have the correct content;
            update();
          });
        },
        unmount: function() {
          instance.docViewer.off('pageNumberUpdated.nextPageButton')
        },
        dataElement: 'nextPageButton'
      };

      instance.setHeaderItems(function(header) {
        header.push(nextPageButton)
      });

      var annotManager = instance.docViewer.getAnnotationManager();
      // Add tool button in header
      let self = this;
      instance.setHeaderItems(function (header) {
        header.push({
          type: 'actionButton',
          img: '../../img/download.svg',
          onClick: function () {
            self.saveAsFile(instance);
            alert('clicked downloaded');
          }
        });
        header.push({
          type: 'actionButton',
          img: '../../img/import-export.svg',
          onClick: function () {
            var xfdfString = annotManager.exportAnnotations({
              links: false,
              widgets: false
            });
            alert('Annotation exported..');
            console.log(xfdfString);
          }
        });
        header.push({
          type: 'actionButton',
          img: '../../img/print.svg',
          onClick: function () {
            alert('clicked print');
          }
        });
      });

      // instance.setHeaderItems(function(header) {
      //   var items = header.getItems().slice(9, -3);
      //   header.update(items);
      // });
      // disable the download button
      instance.disableDownload();

      // disable the open file button
      instance.enableFilePicker(false);
    });
  }

  saveAsFile(instance) {
    console.log('called..')
    var docViewer = instance.docViewer;
    //docViewer.on('documentLoaded', function() {
    var doc = docViewer.getDocument();
    doc.setWatermark(this.watermark());

    var options = {
      xfdfString: docViewer.getAnnotationManager().exportAnnotations()
    };
    // docViewer.on('documentLoaded', function() {
    //   instance.downloadPdf(true);
    // });
    doc.getFileData(options).then(function (data) {
      var arr = new Uint8Array(data);
      var blob = new Blob([arr], {
        type: 'application/pdf'
      });
      // add code for handling Blob here
      saveAs(blob, 'download.pdf');
      console.log('downloaded..')
    });
    // });
  }

  watermark() {
    return {
      // Draw diagonal watermark in middle of the document
      diagonal: {
        fontSize: 25, // or even smaller size
        fontFamily: 'sans-serif',
        color: 'red',
        opacity: 50, // from 0 to 100
        text: 'Watermark'
      },

      // Draw header watermark
      header: {
        fontSize: 10,
        fontFamily: 'sans-serif',
        color: 'red',
        opacity: 70,
        left: 'left watermark',
        center: 'center watermark',
        right: ''
      }
    }
  }

  importAnnotation() {
    this.isCustomActive = false;
    this.isImportActive = true;
    this.isBasicActive = false;
    WebViewer({
      path: '../lib',
      initialDoc: '../files/combinepdf.pdf',
      css: '../../../style.css'
    }, this.viewer.nativeElement).then((instance) => {
      // this.viewerInstance = instance;
      var docViewer = instance.docViewer;
      // Add tool button in header
      let xfdfString = '<?xml version="1.0" encoding="UTF-8" ?>\n' +
        '<xfdf xmlns="http://ns.adobe.com/xfdf/" xml:space="preserve"><fields />\n' +
        '  <annots><squiggly page="0" rect="132.63,587.281,261.79,640.547" color="#E44234" flags="print" name="83304855-79a8-db48-6244-a0a1ab5895f8" title="Guest" subject="Squiggly" date="D:20180919094921-07\'00\'" creationdate="D:20180918165543-07\'00\'" coords="137.63,640.55,256.79,640.55,137.63,595.29,256.79,595.29"><contents>Amplify</contents><apref\n' +
        '    gennum="0" objnum="2433" x="132.63" y="640.547"/></squiggly>\n' +
        '    <text page="0" rect="465.965,472.585,485.965,492.585" color="#FFE6A2" flags="print,nozoom,norotate"\n' +
        '          name="6417ea94-0ac0-0891-70b4-0a4b877893a3" title="Justin" subject="Comment" date="D:20180927141753-07\'00\'"\n' +
        '          creationdate="D:20180927141748-07\'00\'" icon="Comment"><contents>This is awesome!</contents>\n' +
        '      <apref gennum="0" objnum="2484" x="465.965" y="492.585"/></text>\n' +
        '    <ink page="0" rect="59.6491,250.949,415.671,352.471" color="#000000" flags="print"\n' +
        '         name="1aaa176a-e264-fe0f-b7db-b4bf49562d2e" title="Sally" subject="FreeHand" date="D:20180927141816-07\'00\'"\n' +
        '         width="14.4418" opacity="0.499853" creationdate="D:20180927141759-07\'00\'"><apref gennum="0" objnum="2483" x="59.6491" y="352.471"/>\n' +
        '      <inklist><gesture>67.37,258.67;80.47,268.02;127.25,298.9;142.22,308.26;173.1,327.91;186.2,336.33;200.23,343.81;203.04,344.75;203.04,344.75;203.04,344.75;201.17,334.46;197.43,323.23;189.01,300.77;184.33,288.61;175.91,269.89;173.1,265.22;171.23,261.47;172.16,261.47;174.04,263.35;196.49,281.12;208.65,290.48;253.57,314.81;270.41,324.16;293.8,332.58;297.54,334.46;298.48,334.46;296.61,327.91;293.8,319.49;286.32,302.64;281.64,294.22;276.02,281.12;275.09,278.32;275.09,276.44;275.09,276.44;287.25,283.93;301.29,293.29;337.78,312;361.17,322.29;392.98,335.39;403.27,337.26;407.02,338.2;407.95,338.2;407.95,336.33;407.95,326.04;407.02,317.61;404.21,302.64;402.34,295.16;401.4,286.74;400.47,283.93;400.47,281.12;400.47,280.19;400.47,280.19;400.47,280.19</gesture></inklist></ink>\n' +
        '    <highlight page="1" rect="46,618.445,152.064,631.704" color="#C544CE" flags="print"\n' +
        '               name="f5ee685c-e8aa-fe1c-3884-12814553367a" title="Guest" subject="Highlight"\n' +
        '               date="D:20180918165643-07\'00\'" creationdate="D:20180918165634-07\'00\'"\n' +
        '               coords="46,631.7,152.06,631.7,46,618.45,152.06,618.45"><contents>Customize the UI</contents>\n' +
        '      <apref gennum="0" objnum="2435" x="46" y="631.704"/></highlight>\n' +
        '    <highlight page="1" rect="46,582.437,103.134,595.696" color="#92E8E8" flags="print"\n' +
        '               name="d157b4c5-b6ef-f28c-726a-57a59f1a39c1" title="Guest" subject="Highlight"\n' +
        '               date="D:20180918165653-07\'00\'" creationdate="D:20180918165650-07\'00\'"\n' +
        '               coords="46,595.7,103.13,595.7,46,582.44,103.13,582.44"><contents>Annotate</contents>\n' +
        '      <apref gennum="0" objnum="2437" x="46" y="595.696"/></highlight>\n' +
        '    <square page="2" rect="12.0983,462.321,276.749,693.701" color="#F69A00" flags="print"\n' +
        '            name="c35991d4-201d-31ef-a1df-d84fb7d3f88b" title="Guest" subject="Rectangle" date="D:20180918165750-07\'00\'"\n' +
        '            width="3.41492" creationdate="D:20180918165728-07\'00\'"/>\n' +
        '    <ink page="1" rect="53.183267,419.15405,194.359894,512.521912" color="#E44234" flags="print"\n' +
        '         name="ec27ea99-142d-2140-25b5-c211955d8091" title="Guest" subject="Free hand" date="D:20190923154543Z00\'00\'"\n' +
        '         creationdate="D:20190923154538Z00\'00\'"><inklist><gesture>57.37,420.15;58.43,420.15;60.56,420.15;69.06,420.15;77.56,420.15;89.24,420.15;103.05,420.15;115.8,420.15;123.24,420.15;135.99,420.15;147.68,420.15;160.42,420.15;167.86,420.15;173.17,420.15;176.36,420.15;180.61,420.15;183.8,420.15;190.17,420.15;192.3,420.15;193.36,421.22;193.36,421.22</gesture><gesture>57.37,511.52;60.56,511.52;69.06,511.52;79.68,511.52;94.56,511.52;107.3,510.46;121.12,510.46;129.61,510.46;139.18,510.46;146.61,510.46;152.99,510.46;158.3,510.46;163.61,510.46;164.67,510.46;165.74,510.46;166.8,510.46;166.8,510.46</gesture><gesture>54.18,455.21;55.25,455.21;58.43,455.21;67.99,455.21;81.81,455.21;96.68,455.21;110.49,455.21;129.61,455.21;149.8,455.21;167.86,455.21;178.49,455.21;184.86,455.21;188.05,455.21;188.05,455.21</gesture></inklist></ink>\n' +
        '    <highlight page="1" rect="365.1641,218.708362,552.5796,319.582689" color="#F1A099" flags="print"\n' +
        '               name="5c99aaf4-e668-9cbe-68f2-9e26acc6a7af" title="Guest" subject="Highlight"\n' +
        '               date="D:20190923154547Z00\'00\'" creationdate="D:20190923154546Z00\'00\'"\n' +
        '               coords="365.16,319.58,493.77,319.58,365.16,308.68,493.77,308.68,365.16,304.59,541.51,304.59,365.16,293.69,541.51,293.69,365.16,289.59,526.93,289.59,365.16,278.69,526.93,278.69,365.16,274.59,531.88,274.59,365.16,263.7,531.88,263.7,365.16,259.6,552.58,259.6,365.16,248.7,552.58,248.7,365.16,244.6,504.51,244.6,365.16,233.7,504.51,233.7,365.16,229.61,498.29,229.61,365.16,218.71,498.29,218.71"><contents>Considering all aspects of\n' +
        'performance, quality, and technical\n' +
        'capability, there was no contest.\n' +
        'PDFTron provided everything we\n' +
        'needed to embed PDF viewing in our\n' +
        'product, while retaining our\n' +
        'application’s look and feel.</contents></highlight>\n' +
        '    <circle page="2" rect="372.908367,268.22842,576.89243,448.839309" color="#000000" flags="print"\n' +
        '            name="0cc51a5e-a074-b130-aa5e-19bd01222c17" title="Guest" subject="Ellipse" date="D:20190923154555Z00\'00\'"\n' +
        '            creationdate="D:20190923154554Z00\'00\'"/>\n' +
        '    <text page="2" rect="452.589641,537.205843,472.589641,557.205843" color="#FFE6A2" flags="print,nozoom,norotate"\n' +
        '          name="b148d609-e79f-d3e5-32bc-62953040e78b" title="Guest" subject="Comment" date="D:20190923154606Z00\'00\'"\n' +
        '          creationdate="D:20190923154558Z00\'00\'" icon="Comment"><contents>vbngfhgfghf</contents></text>\n' +
        '    <freetext page="1" rect="386.719788,701.25787,595.390204,752.690571" flags="print"\n' +
        '              name="bc03efae-14f0-381f-7836-5a0dcc86ba56" title="Guest" subject="Free text"\n' +
        '              date="D:20190923154620Z00\'00\'" width="2.3431763766959297" creationdate="D:20190923154614Z00\'00\'"\n' +
        '              TextColor="#E44234" FontSize="37.47246608140463"><contents>Annotated...</contents>\n' +
        '      <defaultappearance>0 0 0 rg /Helvetica 37.47246608140463 Tf</defaultappearance>\n' +
        '      <defaultstyle>font: Helvetica 37.47246608140463pt; text-align: left; color: #E44234</defaultstyle></freetext>\n' +
        '    <ink page="1" rect="222.974768,683.197316,359.229748,774.990145" color="#25D2D1" flags="print"\n' +
        '         name="174882a1-e18f-f470-0eea-38887998188a" title="Guest" subject="Signature" date="D:20190923154630Z00\'00\'"\n' +
        '         creationdate="D:20190923154623Z00\'00\'"><inklist><gesture>230.15,767.82;230.15,767.82;230.15,757.78;234.45,746.3;238.75,736.27;245.92,716.19;253.09,706.15;257.4,703.28;267.44,700.41;307.6,721.92;323.37,756.34;323.37,766.38;314.77,773.56;268.87,773.56;245.92,759.21;224.41,721.92;224.41,703.28;228.71,691.8;238.75,684.63;263.13,684.63;320.5,700.41;346.32,716.19;353.49,727.66;357.8,736.27</gesture></inklist></ink></annots>\n' +
        '  <pages><defmtx matrix="1,0,0,-1,0,792" /></pages></xfdf>';
      var annotManager = instance.docViewer.getAnnotationManager();
      annotManager.importAnnotCommand(xfdfString);
    });
  }

  openWin() {
    window.open('', 'mywindow');
  }
}
