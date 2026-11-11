FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["ApiCQRS/ApiCQRS.csproj", "ApiCQRS/"]
COPY ["ApiCQRS.Models/ApiCQRS.Models.csproj", "ApiCQRS.Models/"]
COPY ["ApiCQRS.Query/ApiCQRS.Query.csproj", "ApiCQRS.Query/"]
COPY ["ApiCQRS.Repository/ApiCQRS.Repository.csproj", "ApiCQRS.Repository/"]
RUN dotnet restore "ApiCQRS/ApiCQRS.csproj"

COPY . .
WORKDIR "/src/ApiCQRS"
RUN dotnet publish "ApiCQRS.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 5266
ENV ASPNETCORE_URLS=http://+:5266
ENV ASPNETCORE_ENVIRONMENT=Development
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "ApiCQRS.dll"]
