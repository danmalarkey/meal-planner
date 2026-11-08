import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  input,
  output,
  signal,
  viewChild
} from '@angular/core';
import { UiButtonComponent } from '../button/ui-button.component';
import { UiModalComponent, UiModalFooterDirective } from '../modal/ui-modal.component';

@Component({
    selector: 'ui-camera-capture',
    imports: [UiButtonComponent, UiModalComponent, UiModalFooterDirective],
    template: `
    <ui-modal
      [open]="open()"
      title="Take photo"
      description="Frame the item in the camera, then use the photo."
      size="md"
      mobilePresentation="full-screen"
      (closed)="close()"
    >
      <div class="ui-camera-capture">
        <video #video class="ui-camera-capture__preview" autoplay muted playsinline></video>
        @if (message()) {
          <p class="ui-camera-capture__message" role="status">{{ message() }}</p>
        }
      </div>

      <div modal-footer class="ui-action-row ui-action-row--nowrap ui-action-row--end">
        <ui-button variant="ghost" (clicked)="close()">Cancel</ui-button>
        @if (cameraFailed()) {
          <ui-button variant="secondary-elevated" (clicked)="startCamera()">Try again</ui-button>
        } @else {
          <ui-button
            variant="primary-elevated"
            iconLeading="camera"
            [disabled]="!cameraReady()"
            [loading]="capturePending()"
            loadingLabel="Using photo"
            (clicked)="capture()"
          >
            Use photo
          </ui-button>
        }
      </div>
    </ui-modal>
  `,
    styleUrl: './ui-camera-capture.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiCameraCaptureComponent implements OnDestroy {
  readonly open = input(false);
  readonly closed = output<void>();
  readonly captured = output<File>();

  private readonly video = viewChild<ElementRef<HTMLVideoElement>>('video');
  protected readonly cameraReady = signal(false);
  protected readonly cameraFailed = signal(false);
  protected readonly capturePending = signal(false);
  protected readonly message = signal('Requesting camera access...');

  private stream: MediaStream | null = null;
  private requestSequence = 0;

  constructor() {
    effect(
      () => {
        if (this.open()) {
          window.setTimeout(() => void this.startCamera(), 0);
        } else {
          this.stopCamera();
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  protected async startCamera(): Promise<void> {
    const requestSequence = ++this.requestSequence;
    this.stopCamera(false);
    this.cameraReady.set(false);
    this.cameraFailed.set(false);
    this.message.set('Requesting camera access...');

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access is not available in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });

      if (!this.open() || requestSequence !== this.requestSequence) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      const video = this.video()?.nativeElement;

      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        throw new Error('The camera preview could not be opened.');
      }

      this.stream = stream;
      video.srcObject = stream;
      await video.play();
      this.cameraReady.set(true);
      this.message.set('Frame the item, then take the photo.');
    } catch (error) {
      if (requestSequence !== this.requestSequence) {
        return;
      }

      this.cameraFailed.set(true);
      this.message.set(error instanceof Error ? error.message : 'Camera access is unavailable.');
    }
  }

  protected async capture(): Promise<void> {
    const video = this.video()?.nativeElement;

    if (!video || !video.videoWidth || !video.videoHeight || this.capturePending()) {
      this.message.set('The camera is not ready yet. Try again in a moment.');
      return;
    }

    this.capturePending.set(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('The photo could not be captured.');
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));

      if (!blob) {
        throw new Error('The photo could not be captured.');
      }

      this.captured.emit(new File([blob], `meal-planner-photo-${Date.now()}.jpg`, { type: 'image/jpeg' }));
      this.close();
    } catch (error) {
      this.message.set(error instanceof Error ? error.message : 'The photo could not be captured.');
    } finally {
      this.capturePending.set(false);
    }
  }

  protected close(): void {
    this.stopCamera();
    this.closed.emit();
  }

  private stopCamera(invalidateRequest = true): void {
    if (invalidateRequest) {
      this.requestSequence += 1;
    }

    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.cameraReady.set(false);

    const video = this.video()?.nativeElement;
    if (video) {
      video.srcObject = null;
    }
  }
}
