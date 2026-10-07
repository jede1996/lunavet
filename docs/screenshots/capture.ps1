$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$shots = @(
  @{ name = '01_landing_inicio.png'; url = 'http://localhost:5173/' },
  @{ name = '02_servicios_catalogo.png'; url = 'http://localhost:5173/servicios' },
  @{ name = '03_farmacia_tienda.png'; url = 'http://localhost:5173/tienda' },
  @{ name = '04_agendar_cita.png'; url = 'http://localhost:5173/citas' },
  @{ name = '05_generador_placas_qr.png'; url = 'http://localhost:5173/qr' },
  @{ name = '06_login_acceso.png'; url = 'http://localhost:5173/login' },
  @{ name = '07_registro_cuenta.png'; url = 'http://localhost:5173/registro' },
  @{ name = '08_portal_tutor.png'; url = 'http://localhost:5173/portal?demo_role=cliente' },
  @{ name = '09_agenda_medica.png'; url = 'http://localhost:5173/staff/agenda?demo_role=veterinario' },
  @{ name = '10_consulta_clinica.png'; url = 'http://localhost:5173/staff/consultas?demo_role=veterinario' },
  @{ name = '11_hospitalizacion_uci.png'; url = 'http://localhost:5173/staff/hospitalizacion?demo_role=veterinario' },
  @{ name = '12_pos_caja_chica.png'; url = 'http://localhost:5173/staff/pos?demo_role=veterinario' },
  @{ name = '13_admin_dashboard.png'; url = 'http://localhost:5173/admin/dashboard?demo_role=administrador' },
  @{ name = '14_inventario_fefo.png'; url = 'http://localhost:5173/admin/inventario?demo_role=administrador' },
  @{ name = '15_verificador_receta.png'; url = 'http://localhost:5173/receta/REC-2026-DEMO' }
)

foreach ($item in $shots) {
  $target = Join-Path 'c:\Users\diego\Desktop\vet\docs\screenshots' $item.name
  Write-Host "Capturing $($item.name) from $($item.url)..."
  Start-Process -FilePath $edge -ArgumentList '--headless=new', '--window-size=1280,800', "--screenshot=$target", '--virtual-time-budget=2000', $item.url -Wait
}

Write-Host "All screenshots captured successfully!"
Get-ChildItem -Path 'c:\Users\diego\Desktop\vet\docs\screenshots' -Filter '*.png' | Select-Object Name, Length
