namespace MauiDeviceApis
{
    public partial class MainPage : ContentPage
    {
        public MainPage()
        {
            InitializeComponent();
        }

        private void OnBatteryClicked(object? sender, EventArgs e)
        {
            SetChargeModeLabel();
        }

        private async void OnPickImageClicked(object? sender, EventArgs e)
        {
            await PickPhotoAsync();
        }

        private async void OnTakePictureClicked(object? sender, EventArgs e)
        {
            await TakePhotoAsync();
        }

        private async void OnTakeScreenshotClicked(object? sender, EventArgs e)
        {
            await TakeScreenshotAsync();
        }

        public async Task TakePhotoAsync()
        {
            if (MediaPicker.Default.IsCaptureSupported)
            {
                FileResult photo = await MediaPicker.Default.CapturePhotoAsync();

                if (photo != null)
                {
                    Stream sourceStream = await photo.OpenReadAsync();
                    myImage.Source = ImageSource.FromStream(() => sourceStream);
                }
            }
        }

        public async Task PickPhotoAsync()
        {
            if (MediaPicker.Default.IsCaptureSupported)
            {
                FileResult photo = await MediaPicker.Default.PickPhotoAsync();

                if (photo != null)
                {
                    Stream sourceStream = await photo.OpenReadAsync();
                    myImage.Source = ImageSource.FromStream(() => sourceStream);
                }
            }
        }

        public async Task TakeScreenshotAsync()
        {
            if (Screenshot.Default.IsCaptureSupported)
            {
                IScreenshotResult screen = await Screenshot.Default.CaptureAsync();

                Stream stream = await screen.OpenReadAsync();

                myImage.Source = ImageSource.FromStream(() => stream);
            }
        }

        private void SetChargeModeLabel()
        {
            batteryInfoLabel.Text = Battery.Default.PowerSource switch
            {
                BatteryPowerSource.Wireless => "Wireless charging",
                BatteryPowerSource.Usb => "USB cable charging",
                BatteryPowerSource.AC => "Device is plugged in to a power source",
                BatteryPowerSource.Battery => "Device isn't charging",
                _ => "Unknown"
            };
        }
    }
}
