package telemetry

import (
	"context"
	"crypto/tls"
	"log"
	"os"
	"strings"
	"time"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/propagation"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/sdk/resource"
	semconv "go.opentelemetry.io/otel/semconv/v1.17.0"
	"google.golang.org/grpc/credentials"
)

// InitTracer initializes an OTLP exporter and configures the OpenTelemetry global tracer provider.
func InitTracer(endpoint string) (*sdktrace.TracerProvider, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	insecureStr := os.Getenv("OTEL_EXPORTER_OTLP_INSECURE")
	var secureOpt otlptracegrpc.Option
	if strings.ToLower(insecureStr) == "false" {
		secureOpt = otlptracegrpc.WithTLSCredentials(credentials.NewTLS(&tls.Config{}))
		log.Println("Telemetry configured with TLS credentials (secure transport)")
	} else {
		secureOpt = otlptracegrpc.WithInsecure()
		log.Println("Telemetry configured with insecure transport")
	}

	exporter, err := otlptracegrpc.New(ctx,
		otlptracegrpc.WithEndpoint(endpoint),
		secureOpt,
	)
	if err != nil {
		return nil, err
	}

	res, err := resource.New(ctx,
		resource.WithAttributes(
			semconv.ServiceNameKey.String("scout-agent"),
		),
	)
	if err != nil {
		return nil, err
	}

	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(res),
	)
	otel.SetTracerProvider(tp)
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(propagation.TraceContext{}, propagation.Baggage{}))

	log.Println("Tracer initialized successfully")
	return tp, nil
}
