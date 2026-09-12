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

        private async void OnCheckNetworkClicked(object? sender, EventArgs e)
        {
            await CheckNetworkAsync();
        }

        private async void OnTakeScreenshotClicked(object? sender, EventArgs e)
        {
            await TakeScreenshotAsync();
        }

        public async Task CheckNetworkAsync()
        {
            var access = Connectivity.Current.NetworkAccess;
            
            deviceInfoLabel.Text = access switch
            {
                NetworkAccess.Internet => "Internet is available",
                NetworkAccess.ConstrainedInternet => "Internet is available but constrained",
                NetworkAccess.Local => "Local network only",
                NetworkAccess.None => "No network access",
                _ => "Unknown network access"
            };
        }

        public async Task PickPhotoAsync()
        {
            if (MediaPicker.Default.IsCaptureSupported)
            {
                var options = new MediaPickerOptions
                {
                    Title = "Please pick a photo",
                    SelectionLimit = 1
                };
                List<FileResult> photos = await MediaPicker.Default.PickPhotosAsync(options);

                if (photos != null && photos.Count > 0)
                {
                    Stream sourceStream = await photos[0].OpenReadAsync();
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
            deviceInfoLabel.Text = Battery.Default.PowerSource switch
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
