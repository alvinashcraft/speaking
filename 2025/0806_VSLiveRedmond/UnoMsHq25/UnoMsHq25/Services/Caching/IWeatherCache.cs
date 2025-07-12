namespace UnoMsHq25.Services.Caching;
using WeatherForecast = UnoMsHq25.Client.Models.WeatherForecast;
public interface IWeatherCache
{
    ValueTask<IImmutableList<WeatherForecast>> GetForecast(CancellationToken token);
}
