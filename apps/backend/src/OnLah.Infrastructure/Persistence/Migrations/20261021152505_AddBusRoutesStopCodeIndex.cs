using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OnLah.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBusRoutesStopCodeIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_BusRoutes_BusStopCode",
                table: "BusRoutes",
                column: "BusStopCode");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_BusRoutes_BusStopCode",
                table: "BusRoutes");
        }
    }
}
