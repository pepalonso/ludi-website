import { Component, EventEmitter, Input, Output } from '@angular/core';
import {  HttpClient, HttpEventType } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { CdkStepper } from '@angular/cdk/stepper';

interface FileItem {
  file: File;
  name: string;
  size: string;
  type: string;
  progress: number;
  uploaded: boolean;
  error: boolean;
  id: string;
}

@Component({
  selector: 'app-fitxes-jugadors',
  standalone: true,
  templateUrl: './fitxes-jugadors.component.html',
  styleUrls: ['./fitxes-jugadors.component.css'],
})
export class FitxesJugadorsComponent {
  @Input() maxFiles = 5;
  @Input() maxFileSize = 5;
  @Input() acceptedFileTypes = '*';
  @Input() uploadUrl = '';

  @Output() filesChanged = new EventEmitter<File[]>();
  @Output() uploadComplete = new EventEmitter<{
    success: boolean;
    files: FileItem[];
  }>();

  files: FileItem[] = [];
  isDragging = false;
  isUploading = false;

  constructor(
    private http: HttpClient,
    private stepper: CdkStepper,
  ) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFiles(Array.from(input.files));
      // Reset input so the same file can be selected again
      input.value = '';
    }
  }

  /**
   * Handles drag events
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files) {
      this.addFiles(Array.from(event.dataTransfer.files));
    }
  }

  /**
   * Process and add files to the list
   */
  private addFiles(newFiles: File[]): void {
    // Check if adding these files would exceed the maximum
    if (this.files.length + newFiles.length > this.maxFiles) {
      alert(`You can only upload a maximum of ${this.maxFiles} files.`);
      return;
    }

    // Process each file
    newFiles.forEach((file) => {
      // Check file size
      if (file.size > this.maxFileSize * 1024 * 1024) {
        alert(
          `File ${file.name} exceeds the maximum size of ${this.maxFileSize}MB.`
        );
        return;
      }

      // Create a file item
      const fileItem: FileItem = {
        file,
        name: file.name,
        size: this.formatFileSize(file.size),
        type: this.getFileType(file),
        progress: 0,
        uploaded: false,
        error: false,
        id: this.generateId(),
      };

      this.files.push(fileItem);
    });

    // Emit the updated files array
    this.filesChanged.emit(this.files.map((f) => f.file));
  }

  /**
   * Remove a file from the list
   */
  removeFile(index: number): void {
    this.files.splice(index, 1);
    this.filesChanged.emit(this.files.map((f) => f.file));
  }

  /**
   * Upload all files to the server
   */
  uploadFiles(): void {
    if (this.files.length === 0 || !this.uploadUrl) {
      return;
    }

    this.isUploading = true;
    let completedUploads = 0;
    let failedUploads = 0;

    this.files.forEach((fileItem, index) => {
      if (fileItem.uploaded) {
        completedUploads++;
        this.checkUploadCompletion(completedUploads, failedUploads);
        return;
      }

      const formData = new FormData();
      formData.append('file', fileItem.file, fileItem.name);

      this.http
        .post(this.uploadUrl, formData, {
          reportProgress: true,
          observe: 'events',
        })
        .pipe(
          finalize(() => {
            if (!fileItem.uploaded) {
              failedUploads++;
              fileItem.error = true;
            }
            this.checkUploadCompletion(completedUploads, failedUploads);
          })
        )
        .subscribe(
          (event) => {
            if (event.type === HttpEventType.UploadProgress && event.total) {
              fileItem.progress = Math.round(
                (100 * event.loaded) / event.total
              );
            } else if (event.type === HttpEventType.Response) {
              if (event.status === 200) {
                fileItem.uploaded = true;
                fileItem.progress = 100;
                completedUploads++;
              }
            }
          },
          (error) => {
            fileItem.error = true;
            failedUploads++;
          }
        );
    });
  }

  /**
   * Check if all uploads are complete
   */
  private checkUploadCompletion(completed: number, failed: number): void {
    if (completed + failed === this.files.length) {
      this.isUploading = false;
      this.uploadComplete.emit({
        success: failed === 0,
        files: this.files,
      });
    }
  }

  /**
   * Format file size to human-readable format
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file type icon based on file extension
   */
  private getFileType(file: File): string {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';

    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(extension)) {
      return 'image';
    } else if (['pdf'].includes(extension)) {
      return 'pdf';
    } else if (['doc', 'docx'].includes(extension)) {
      return 'word';
    } else if (['xls', 'xlsx'].includes(extension)) {
      return 'excel';
    } else if (['ppt', 'pptx'].includes(extension)) {
      return 'powerpoint';
    } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
      return 'archive';
    } else if (['mp4', 'avi', 'mov', 'wmv'].includes(extension)) {
      return 'video';
    } else if (['mp3', 'wav', 'ogg'].includes(extension)) {
      return 'audio';
    } else {
      return 'file';
    }
  }

  /**
   * Generate a unique ID for each file
   */
  private generateId(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  /**
   * Get file icon class based on file type
   */
  getFileIconClass(fileType: string): string {
    switch (fileType) {
      case 'image':
        return 'image';
      case 'pdf':
        return 'picture_as_pdf';
      case 'word':
        return 'description';
      case 'excel':
        return 'table_chart';
      case 'powerpoint':
        return 'slideshow';
      case 'archive':
        return 'folder_zip';
      case 'video':
        return 'videocam';
      case 'audio':
        return 'audiotrack';
      default:
        return 'insert_drive_file';
    }
  }

  nextStep() {
    this.stepper.next();
  }

  previStep() {
    this.stepper.previous();
  }
}
